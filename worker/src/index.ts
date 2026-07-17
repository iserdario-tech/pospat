import { buildPushHTTPRequest } from "@pushforge/builder";
import type { Profile } from "../../src/index.js";
import { planDay, parseHM } from "../../src/index.js";
import { dueWindows, checkinDue } from "../../src/push.js";
import { coachStream, type CoachTurn } from "./coach.js";

interface Env {
  SUBS: KVNamespace;
  VAPID_PRIVATE: string;  // приватный VAPID-ключ (JWK-строка), секрет
  AI: Ai;                 // бесплатная ИИ Cloudflare для коуча (биндинг из wrangler.toml)
}

const COACH_DAILY_LIMIT = 40; // эндпоинт публичный — без лимита любой выест бесплатную квоту ИИ за день
// ponytail: счётчик в KV по IP; KV не строго консистентен, для потолка запросов этого хватает.
async function overCoachLimit(env: Env, ip: string): Promise<boolean> {
  const key = `rl:${ip}:${new Date().toISOString().slice(0, 10)}`;
  const used = Number((await env.SUBS.get(key)) ?? 0);
  if (used >= COACH_DAILY_LIMIT) return true;
  await env.SUBS.put(key, String(used + 1), { expirationTtl: 172800 });
  return false;
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
const JSON_CORS: Record<string, string> = { ...CORS, "content-type": "application/json" };

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
      // приветственный пуш — мгновенное подтверждение, что доставка работает
      try {
        const { endpoint, headers: h, body: pb } = await buildPushHTTPRequest({
          privateJWK: JSON.parse(env.VAPID_PRIVATE),
          subscription: body.subscription!,
          message: {
            payload: { title: "pospat", body: "Напоминания включены ✅" },
            adminContact: "mailto:pospat@pospat.app",
            options: { ttl: 600, urgency: "high" },
          },
        });
        await fetch(endpoint, { method: "POST", headers: h, body: pb });
      } catch (_) { /* не критично */ }
      return new Response("ok", { headers: CORS });
    }

    if (req.method === "POST" && url.pathname === "/coach") {
      const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
      if (await overCoachLimit(env, ip))
        return new Response(JSON.stringify({ error: "На сегодня хватит вопросов — продолжим завтра." }), { status: 429, headers: JSON_CORS });
      const body = (await req.json()) as { messages?: CoachTurn[]; contextRU?: string };
      const messages = (body.messages ?? []).slice(-10); // держим короткий хвост: дешевле и достаточно
      if (!messages.length || messages.some((m) => !m.content?.trim()))
        return new Response(JSON.stringify({ error: "bad request" }), { status: 400, headers: JSON_CORS });
      try {
        const stream = await coachStream({ ai: env.AI, messages, contextRU: body.contextRU ?? "Ничего не известно." });
        return new Response(stream, { headers: { ...CORS, "content-type": "text/event-stream" } });
      } catch (e) {
        console.error("coach error", String((e as any)?.message ?? e));
        return new Response(JSON.stringify({ error: "Коуч сейчас недоступен. Попробуй позже." }), { status: 502, headers: JSON_CORS });
      }
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
      // Что шлём в это окно: шаги плана + утренняя отметка «как спалось?»
      const outgoing: { kind: string; title: string; body: string; data?: { url: string } }[] =
        dueWindows(plan.windows, minOfDay, 5).map((w) => ({ kind: w.kind, title: w.title, body: w.detail }));
      if (checkinDue(minOfDay, parseHM(s.profile.anchorWakeHM)))
        outgoing.push({ kind: "checkin", title: "Как спалось?", body: "Отметь подъём — план на день подстроится под тебя.", data: { url: "/pospat/#mark" } });

      const sent = s.sent && s.sent.date === localDate ? s.sent : { date: localDate, kinds: [] as string[] };
      let changed = false;
      for (const o of outgoing) {
        if (sent.kinds.includes(o.kind)) continue;
        try {
          const { endpoint, headers, body } = await buildPushHTTPRequest({
            privateJWK,
            subscription: s.subscription,
            message: {
              payload: { title: o.title, body: o.body, ...(o.data ? { data: o.data } : {}) },
              adminContact: "mailto:pospat@pospat.app",
              options: { ttl: 3600, urgency: "normal" },
            },
          });
          const res = await fetch(endpoint, { method: "POST", headers, body });
          if (res.status === 404 || res.status === 410) { await env.SUBS.delete(k.name); }
          else { sent.kinds.push(o.kind); changed = true; }
        } catch (_) { /* пропускаем сбойную отправку */ }
      }
      if (changed) { s.sent = sent; await env.SUBS.put(k.name, JSON.stringify(s)); }
    }
  },
};
