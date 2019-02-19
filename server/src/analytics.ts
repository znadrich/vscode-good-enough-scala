import Kefir = require("kefir");
import ua = require("universal-analytics");
import {now} from "./util";

const gaId = "UA-43398941-7";

const clientStream = Kefir.pool<ua.Visitor, {}>();

interface GAEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}
const eventStream = Kefir.pool<GAEvent, {}>();
Kefir.combine<any, {}, void>([clientStream, eventStream], (client: ua.Visitor, event: GAEvent) =>
  (event.label && event.value
    ? client.event(event.category, event.action, event.label, event.value)
    : client.event(event.category, event.action)).send()).observe();

interface GATiming { category: string; action: string; duration: number; }
const timingStream = Kefir.pool<GATiming, {}>();
Kefir.combine<any, {}, void>([clientStream, timingStream], (client: ua.Visitor, timing: GATiming) =>
  client.timing(timing.category, timing.action, timing.duration).send()).observe();

const Analytics = {
  init: (machineId: string): void => { clientStream.plug(Kefir.constant(ua(gaId, machineId))); },

  trackEvent: (category: string, action: string, label?: string, value?: number): void => {
    eventStream.plug(Kefir.constant({ category, action, label, value }));
  },

  trackTiming: (category: string, action: string, duration: number): void => {
    timingStream.plug(Kefir.constant({ category, action, duration }));
  },

  timed: <A>(category: string, action: string) => (fn: () => A): A => {
    const start = now();
    const res = fn();
    setImmediate(() => {
      Array.isArray(res)
      ? Analytics.trackEvent(category, action, "results", res.length)
      : Analytics.trackEvent(category, action);
      Analytics.trackTiming(category, action, now() - start);
    });
    return res;
  }
};

export default Analytics;
