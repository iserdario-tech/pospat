import { buildPushHTTPRequest } from "@pushforge/builder";
import type { Profile } from "../../src/index.js";
import { planDay } from "../../src/index.js";
import { dueWindows } from "../../src/push.js";

interface Env {
  SUBS: KVNamespace;
  VAPID_PRIVATE: string; // приватный VAPID-ключ в формате JWK (JSON-строка), задаётся секретом
}
interface StoredSub {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  profile: Profile;
  tzOffsetMin: number;
  sent?: { date: string; kinds: string[] };
}

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname === "/subscribe") {
      const body = (await req.json()) as Partial<StoredSub>;
      if (!body?.subscription?.endpoint)
        return new Response("bad request", { status: 400, headers: CORS });
      await env.SUBS.put(body.subscription.endpoint, JSON.stringify({
        subscription: body.subscription,
        profile: body.profile,
        tzOffsetMin: body.tzOffsetMin ?? 0,
      }));
      return new Response("ok", { headers: CORS });
    }
    return new Response("pospat push", { headers: CORS });
  },

  async scheduled(_evt: ScheduledController, env: Env): Promise<void> {
    const privateJWK = JSON.parse(env.VAPID_PRIVATE);
    const nowUtcMin = Math.floor(Date.now() / 60000);
    const list = await env.SUBS.list();
    for (const k of list.keys) {
      const raw = await env.SUBS.get(k.name);
      if (!raw) continue;
      const s = JSON.parse(raw) as StoredSub;
      const localMin = nowUtcMin + (s.tzOffsetMin ?? 0);
      const minOfDay = ((localMin % 1440) + 1440) % 1440;
      const localDate = new Date(localMin * 60000).toISOString().slice(0, 10);

      const plan = planDay({
        profile: s.profile,
        ctx: { date: localDate, mode: "normal", toggles: {} },
        lastNight: { wokeHM: s.profile.anchorWakeHM, quality: 3 },
        history: [],
      });
      const due = dueWindows(plan.windows, minOfDay, 5);
      const sent = s.sent && s.sent.date === localDate ? s.sent : { date: localDate, kinds: [] as string[] };

      let changed = false;
      for (const w of due) {
        if (sent.kinds.includes(w.kind)) continue;
        try {
          const { endpoint, headers, body } = await buildPushHTTPRequest({
            privateJWK,
            subscription: s.subscription,
            message: {
              payload: { title: w.title, body: w.detail },
              adminContact: "mailto:pospat@pospat.app",
              options: { ttl: 3600, urgency: "normal" },
            },
          });
          const res = await fetch(endpoint, { method: "POST", headers, body });
          if (res.status === 404 || res.status === 410) { await env.SUBS.delete(k.name); }
          else { sent.kinds.push(w.kind); changed = true; }
        } catch (_) { /* пропускаем сбойную отправку */ }
      }
      if (changed) { s.sent = sent; await env.SUBS.put(k.name, JSON.stringify(s)); }
    }
  },
};
