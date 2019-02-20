export const applyTo = <A, B>(f: (a: A) => B) => (a: A): B => f(a);

export const exhaustive = (a: never): never => a;

export type NEL<A> = [A, ...A[]];
export const toNel = <A>(as: A[]): NEL<A> | undefined => as.length > 0 ? [as[0], ...as.slice(1)] : undefined;

export const now = () => (new Date()).getTime();

export const ord = (i1: string | number, i2: string | number) => i1 < i2 ? -1 : (i1 === i2 ? 0 : 1);
export const ordAll = <A>(...[f, fs]: [(a: A) => string | number, ...((a: A) => string | number)[]]) => (a1: A, a2: A): -1 | 0 | 1 =>
  [f].concat(fs).reduce((acc: -1 | 0 | 1, fn: (a: A) => string | number) => acc === 0 ? ord(fn(a1), fn(a2)) : acc, ord(f(a1), f(a2)));

export function pipe<A, B, C>(f1: (a: A) => B, f2: (b: B) => C): (a: A) => C;
export function pipe<A, B, C, D>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D): (a: A) => D;
export function pipe<A, B, C, D, E>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E): (a: A) => E;
export function pipe<A, B, C, D, E, F>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E, f5: (e: E) => F): (a: A) => F;
export function pipe<A, B, C, D, E, F, G>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E, f5: (e: E) => F, f6: (f: F) => G): (a: A) => G;
export function pipe<A, B, C, D, E, F, G, H>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E, f5: (e: E) => F, f6: (f: F) => G, f7: (g: G) => H): (a: A) => H;
export function pipe<A, B, C, D, E, F, G, H, I>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E, f5: (e: E) => F, f6: (f: F) => G, f7: (g: G) => H, f8: (h: H) => I): (a: A) => I;
export function pipe<A, B, C, D, E, F, G, H, I, J>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E, f5: (e: E) => F, f6: (f: F) => G, f7: (g: G) => H, f8: (h: H) => I, f9: (i: I) => J): (a: A) => J;
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E, f5: (e: E) => F, f6: (f: F) => G, f7: (g: G) => H, f8: (h: H) => I, f9: (i: I) => J, f10: (j: J) => K): (a: A) => K;
export function pipe(...args: ((x: any) => any)[]): (a: any) => any {
  return (a: any) => args.reduce((acc: any, f: (x: any) => any) => f(acc), a);
}

type PK = PropertyKey;
type R<K extends PK, V> = Record<K, V>;

export function path<K1 extends PK, K2 extends PK>(...[k1, k2]: [K1, K2]): <A extends R<K1, R<K2, any>>>(a: A) => A[K1][K2];
export function path<K1 extends PK, K2 extends PK, K3 extends PK>(...[k1, k2, k3]: [K1, K2, K3]): <A extends R<K1, R<K2, R<K3, any>>>>(a: A) => A[K1][K2][K3];
export function path<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK>(...[k1, k2, k3, k4]: [K1, K2, K3, K4]): <A extends R<K1, R<K2, R<K3, R<K4, any>>>>>(a: A) => A[K1][K2][K3][K4];
export function path<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK>(...[k1, k2, k3, k4, k5]: [K1, K2, K3, K4, K5]): <A extends R<K1, R<K2, R<K3, R<K4, R<K5, any>>>>>>(a: A) => A[K1][K2][K3][K4][K5];
export function path<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK, K6 extends PK>(...[k1, k2, k3, k4, k5, k6]: [K1, K2, K3, K4, K5, K6]): <A extends R<K1, R<K2, R<K3, R<K4, R<K5, R<K6, any>>>>>>>(a: A) => A[K1][K2][K3][K4][K5][K6];
export function path<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK, K6 extends PK, K7 extends PK>(...[k1, k2, k3, k4, k5, k6, k7]: [K1, K2, K3, K4, K5, K6, K7]): <A extends R<K1, R<K2, R<K3, R<K4, R<K5, R<K6, R<K7, any>>>>>>>>(a: A) => A[K1][K2][K3][K4][K5][K6][K7];
export function path<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK, K6 extends PK, K7 extends PK, K8 extends PK>(...[k1, k2, k3, k4, k5, k6, k7, k8]: [K1, K2, K3, K4, K5, K6, K7, K8]): <A extends R<K1, R<K2, R<K3, R<K4, R<K5, R<K6, R<K7, R<K8, any>>>>>>>>>(a: A) => A[K1][K2][K3][K4][K5][K6][K7][K8];
export function path<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK, K6 extends PK, K7 extends PK, K8 extends PK, K9 extends PK>(...[k1, k2, k3, k4, k5, k6, k7, k8, k9]: [K1, K2, K3, K4, K5, K6, K7, K8, K9]): <A extends R<K1, R<K2, R<K3, R<K4, R<K5, R<K6, R<K7, R<K8, R<K9, any>>>>>>>>>>(a: A) => A[K1][K2][K3][K4][K5][K6][K7][K8][K9];
export function path<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK, K6 extends PK, K7 extends PK, K8 extends PK, K9 extends PK, K10 extends PK>(...[k1, k2, k3, k4, k5, k6, k7, k8, k9, k10]: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10]): <A extends R<K1, R<K2, R<K3, R<K4, R<K5, R<K6, R<K7, R<K8, R<K9, R<K10, any>>>>>>>>>>>(a: A) => A[K1][K2][K3][K4][K5][K6][K7][K8][K9][K10];
export function path(...ks: any[]): (a: any) => any {
  return (a: any) => ks.reduce((acc: any, k: any) => acc[k], a);
}


export function setPath<K1 extends PK, K2 extends PK>(...[k1, k2]: [K1, K2]): <V>(v: V) => <A extends R<K1, R<K2, V>>>(a: A) => A;
export function setPath<K1 extends PK, K2 extends PK, K3 extends PK>(...[k1, k2, k3]: [K1, K2, K3]): <V>(v: V) => <A extends R<K1, R<K2, R<K3, V>>>>(a: A) => A;
export function setPath<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK>(...[k1, k2, k3, k4]: [K1, K2, K3, K4]): <V>(v: V) => <A extends R<K1, R<K2, R<K3, R<K4, V>>>>>(a: A) => A;
export function setPath<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK>(...[k1, k2, k3, k4, k5]: [K1, K2, K3, K4, K5]): <V>(v: V) => <A extends R<K1, R<K2, R<K3, R<K4, R<K5, V>>>>>>(a: A) => A;
export function setPath<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK, K6 extends PK>(...[k1, k2, k3, k4, k5, k6]: [K1, K2, K3, K4, K5, K6]): <V>(v: V) => <A extends R<K1, R<K2, R<K3, R<K4, R<K5, R<K6, V>>>>>>>(a: A) => A;
export function setPath<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK, K6 extends PK, K7 extends PK>(...[k1, k2, k3, k4, k5, k6, k7]: [K1, K2, K3, K4, K5, K6, K7]): <V>(v: V) => <A extends R<K1, R<K2, R<K3, R<K4, R<K5, R<K6, R<K7, V>>>>>>>>(a: A) => A;
export function setPath<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK, K6 extends PK, K7 extends PK, K8 extends PK>(...[k1, k2, k3, k4, k5, k6, k7, k8]: [K1, K2, K3, K4, K5, K6, K7, K8]): <V>(v: V) => <A extends R<K1, R<K2, R<K3, R<K4, R<K5, R<K6, R<K7, R<K8, V>>>>>>>>>(a: A) => A;
export function setPath<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK, K6 extends PK, K7 extends PK, K8 extends PK, K9 extends PK>(...[k1, k2, k3, k4, k5, k6, k7, k8, k9]: [K1, K2, K3, K4, K5, K6, K7, K8, K9]): <V>(v: V) => <A extends R<K1, R<K2, R<K3, R<K4, R<K5, R<K6, R<K7, R<K8, R<K9, V>>>>>>>>>>(a: A) => A;
export function setPath<K1 extends PK, K2 extends PK, K3 extends PK, K4 extends PK, K5 extends PK, K6 extends PK, K7 extends PK, K8 extends PK, K9 extends PK, K10 extends PK>(...[k1, k2, k3, k4, k5, k6, k7, k8, k9, k10]: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10]): <V>(v: V) => <A extends R<K1, R<K2, R<K3, R<K4, R<K5, R<K6, R<K7, R<K8, R<K9, R<K10, V>>>>>>>>>>>(a: A) => A;
export function setPath(..._ks: any[]): (v: any) => (a: any) => any {
  const loop = (...ks: any[]) => (v: any) => (a: any): any =>
    Object.assign({}, a, { [ks[0]]: ks.length === 1 ? v : loop(...ks.slice(1))(v)(a[ks[0]]) });

  return (v: any) => (a: any) => loop(..._ks)(v)(a);
}

export const prop = <K extends PK>(k: K) => <A extends R<K, any>>(a: A): A[K] => a[k];

export const tap = <A>(f: (a: A) => void) => (a: A): A => { f(a); return a; };

export const withOpt = <A, O>(fn: (a: A) => O) => (a?: A): O | undefined => a ? fn(a) : undefined;
