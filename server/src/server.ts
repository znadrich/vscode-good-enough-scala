import {
  createConnection,
  DidChangeConfigurationNotification,
  DidChangeConfigurationParams,
  Hover,
  InitializeParams,
  Location,
  MarkupKind,
  ProposedFeatures,
  SymbolInformation,
  SymbolKind,
  TextDocumentPositionParams,
  TextDocuments,
  WorkspaceFolder,
  WorkspaceSymbolParams
} from "vscode-languageserver";
import { spawnSync } from "child_process";
import * as commandExists from "command-exists";
import fileUriToPath = require("file-uri-to-path");
import * as fs from "fs";
import FuzzySearch = require("fuzzy-search");
import * as path from "path";
import {URL} from "url";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments();
documents.listen(connection);

let hasWorkspaceConfig = false;

connection.onInitialize((params: InitializeParams) => {
  hasWorkspaceConfig = !!params.capabilities.workspace && !!params.capabilities.workspace.configuration;
  return {
    capabilities: {
      definitionProvider: true,
      hoverProvider: true,
      workspaceSymbolProvider: true,
      textDocumentSync: documents.syncKind
    }
  }
});

interface Settings { hoverEnabled: boolean }
const defaultSettings: Settings = { hoverEnabled: true };
let settings: Settings = defaultSettings;

function updateSettings(params?: DidChangeConfigurationParams): void {
  if (hasWorkspaceConfig) {
    connection.workspace.getConfiguration("goodEnoughScala").then((s: Settings) => {
      connection.console.log(`Scala settings changed: ${JSON.stringify(s)}`);
      settings = s
    });
  } else if (params && params.settings) {
    connection.console.log(`Scala settings changed: ${JSON.stringify(params.settings.goodEnoughScala)}`);
    settings = params.settings.goodEnoughScala || defaultSettings;
  }
}

connection.onDidChangeConfiguration(updateSettings);

const symPrefix = "__SCALA_SYMBOL__";
function symName(name: string): string { return `${symPrefix}${name}`; }

function flatten<A>(arr: A[][]): A[] { return [].concat.apply([], arr); }

function now(): number { return +(new Date()); }

function regexQuote(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function sortBy<A, B>(fn: (a: A) => B, arr: A[]): A[] {
  const sorters = {
    number: (x: number, y: number): number => x - y,
    any: (x: any, y: any): number => x < y ? -1 : (x > y) ? 1 : 0
  };
  return arr.sort((a1: A, a2: A) => {
    const [b1, b2] = [fn(a1), fn(a2)];
    return (typeof b1 === "number" && typeof b2 === "number")
      ? sorters.number(b1, b2)
      : sorters.any(b1, b2);
  });
}

interface ScalaFile {
  absolutePath: string;
  relativePath: string;
}

function loggedGetFiles(getMethod: string, dir: string, getter: (dir: string) => string[]): string[] {
  connection.console.log(`Getting scala files with ${getMethod}`);
  const res = getter(dir);
  connection.console.log(`Found ${res.length} scala files to index`);
  return res;
}

function getFilesCommand(cmd: string, args: string[]): string[] {
  return spawnSync(cmd, args).stdout.toString().trim().split("\n").filter((f: string) => f !== "");
}

function gitScalaFiles(dir: string): string[] {
  return getFilesCommand("git", ["--git-dir", path.join(dir, ".git"), "ls-files", "*.scala", "*.sc"])
    .map((f: string) => path.join(dir, f));
}

function findCmdScalaFiles(dir: string): string[] {
  return getFilesCommand("find", [dir, "-type", "f", "(", "-iname", "*.scala", "-o", "-iname", "*.sc", ")"]);
}

function dirCmdScalaFiles(dir: string): string[] {
  return getFilesCommand("dir", [dir, "/s/b", "*.scala", "*.sc"]);
}

function fsScalaFiles(dir: string, files: string[] = []): string[] {
  return files.concat(flatten(fs.readdirSync(dir).map((file: string) => {
    const joined = path.resolve(path.join(dir, file));
    return fs.statSync(joined).isDirectory()
      ? fsScalaFiles(joined, files)
      : (/\.scala$/.test(joined) ? [joined] : []);
  })));
}

function getScalaFiles(dir: string): string[] {
  const [getMethod, getter] = ((): [string, (dir: string) => string[]] => {
    switch (true) {
      case fs.existsSync(path.join(dir, ".git")): return ["git", gitScalaFiles];
      case commandExists.sync("find"):            return ["`find`", findCmdScalaFiles];
      case commandExists.sync("dir"):             return ["`dir`", dirCmdScalaFiles];
      default:                                    return ["fs", fsScalaFiles];
    }
  })();
  return loggedGetFiles(getMethod, dir, getter);
}

interface ScalaSymbol {
  name: string;
  _name: string;
  kind: SymbolKind;
  file: ScalaFile;
  location: { line: number; character: number; };
}

function symToUri(sym: ScalaSymbol): string {
  return (new URL(`file://${sym.file.absolutePath}`)).href;
}

function symToLoc(sym: ScalaSymbol): Location {
  return Location.create(symToUri(sym), { start: sym.location, end: sym.location });
}

interface Symbols { [sym: string]: ScalaSymbol[]; }
let symbols: Symbols = {};
let fuzzySearch: FuzzySearch<ScalaSymbol> | undefined;

type SymbolExtractor = (f: ScalaFile, c: string) => ScalaSymbol[];

function extractMatches(rx: RegExp, symbolType: string, kind: SymbolKind, file: ScalaFile): (line: string, lineNum: number) => ScalaSymbol[] {
  return (line: string, lineNum: number) => {
    const offset = symbolType.length + 2;
    const retVal = [];
    let matches = rx.exec(line);
    while (!!matches) {
      retVal.push({
        name: symName(matches[1]),
        _name: matches[1],
        kind,
        file,
        location: { line: lineNum, character: matches.index + offset }
      });
      matches = rx.exec(line);
    }
    return retVal;
  };
}

const alphaRx = /[a-zA-Z]/;
const termRx = new RegExp(`[${alphaRx.source.slice(1, -1)}0-9_]`);

function defaultExtractor(symbolType: string, kind: SymbolKind): (f: ScalaFile, c: string) => ScalaSymbol[] {
  return (file: ScalaFile, contents: string) => {
    const rx = new RegExp(`${symbolType} (${alphaRx.source}${termRx.source}+)`, "g");
    return flatten(contents.split("\n").map(extractMatches(rx, symbolType, kind, file)));
  };
}

const symbolExtractors: SymbolExtractor[] = [
  defaultExtractor("class", SymbolKind.Class),
  defaultExtractor("trait", SymbolKind.Interface),
  defaultExtractor("object", SymbolKind.Class),
  defaultExtractor("val", SymbolKind.Variable),
  defaultExtractor("def", SymbolKind.Function),
  defaultExtractor("type", SymbolKind.TypeParameter)
];

function getScalaSymbols(file: ScalaFile): ScalaSymbol[] {
  const contents = fs.readFileSync(file.absolutePath).toString();
  return flatten(symbolExtractors.map((ex: SymbolExtractor) => ex(file, contents)));
}

function update(): void {
  const start = now();
  connection.workspace.getWorkspaceFolders()
    .then((fldrs: WorkspaceFolder[] | null) =>
      flatten((fldrs || [])
        .filter((f: WorkspaceFolder) => /^file:\/\//i.test(f.uri))
        .map((f: WorkspaceFolder) => fileUriToPath(f.uri))
        .map((dir: string): ScalaFile[] =>
          getScalaFiles(dir).map((f: string) => ({
            absolutePath: f,
            relativePath: f.replace(new RegExp(`^${regexQuote(dir)}(${regexQuote(path.sep)}|\/)?`), "")
          })))))
    .then((files: ScalaFile[]) =>
      Promise.all(files.map((file: ScalaFile) =>
        new Promise((resolve: (syms: ScalaSymbol[]) => void) => resolve(getScalaSymbols(file))))))
    // This is the wrong type but the compiler is complaining. See cast below.
    .then((syms: Promise<ScalaSymbol[][]>) => {
      symbols = flatten(<any>syms as ScalaSymbol[][]).reduce((acc: Symbols, sym: ScalaSymbol) => {
        acc[sym.name] = (acc[sym.name] || []).concat([sym]);
        return acc;
      }, {});
      fuzzySearch = new FuzzySearch(flatten(Object.values(symbols)), ["_name"], { caseSensitive: false, sort: true });
      connection.console.log(`Finished indexing ${Object.keys(symbols).length} scala symbols in ${now() - start}ms`);
    });
}

connection.onInitialized((() => {
  if (hasWorkspaceConfig) { connection.client.register(DidChangeConfigurationNotification.type); }
  updateSettings();
  update();
}));

function buildTerm(line: string, char: number): string {
  const append = (acc: string, changeIdx: (i: number) => number, concat: (newChar: string, term: string) => string): string => {
    let idx = changeIdx(char);
    while (line[idx] && termRx.test(line[idx])) {
      acc = concat(line[idx], acc);
      idx = changeIdx(idx);
    }
    return acc;
  };

  let term = line[char];
  term = append(term, (i: number) => i - 1, (c: string, t: string) => c + t);
  term = append(term, (i: number) => i + 1, (c: string, t: string) => t + c);
  return term;
}

function getTerm(tdp: TextDocumentPositionParams): string | undefined {
  const file = fileUriToPath(tdp.textDocument.uri);
  if (!file) { return; }
  const line = fs.readFileSync(file).toString().split("\n")[tdp.position.line];
  return symName(buildTerm(line, tdp.position.character));
}

connection.onDefinition((tdp: TextDocumentPositionParams): Location[] => {
  const term = getTerm(tdp);
  return ((term && symbols[term]) || []).map(symToLoc);
});

connection.onHover((tdp: TextDocumentPositionParams): Hover | undefined => {
  if (!settings.hoverEnabled) { return undefined; }
  const term = getTerm(tdp);
  return (term && symbols[term])
    ? {
      contents: {
        kind: MarkupKind.Markdown,
        value: sortBy((sym: ScalaSymbol) => sym.file.absolutePath, symbols[term]).map((sym: ScalaSymbol) => {
          const line = `${sym.location.line + 1},${sym.location.character}`;
          return `- [${sym.file.relativePath}:${line}](${symToUri(sym)}#L${line})`;
        }).join("\n")
      }
    }
    : undefined;
});

connection.onWorkspaceSymbol((params: WorkspaceSymbolParams): SymbolInformation[] =>
  fuzzySearch
    ? fuzzySearch.search(params.query.toLowerCase()).map((sym: ScalaSymbol) => ({
        name: sym.name.replace(new RegExp(`^${symPrefix}`), ""),
        kind: sym.kind,
        location: symToLoc(sym)
      }))
    : []);

// TODO - can a single file be updated in the index on save?
connection.onDidSaveTextDocument(update);

connection.listen();
