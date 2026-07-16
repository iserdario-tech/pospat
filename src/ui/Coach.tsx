import React, { useState } from "react";
import { BACKEND_URL } from "./notifications.js";

interface Turn { role: "user" | "assistant"; content: string }

const HINTS = ["Почему я разбитый?", "Как продержаться сегодня?", "Спал 5 часов — что делать?"];

export function Coach({ contextRU }: { contextRU: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: q }];
    setTurns(next); setDraft(""); setErr(""); setBusy(true);
    try {
      const res = await fetch(BACKEND_URL + "/coach", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, contextRU }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) setErr(data.error ?? "Коуч сейчас недоступен. Попробуй позже.");
      else setTurns([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setErr("Нет связи. Проверь интернет и попробуй ещё раз.");
    } finally { setBusy(false); }
  };

  return (
    <details className="coach">
      <summary>💬 Спросить совета</summary>
      <div className="coach-body">
        <p className="small muted">Спроси про сон и бодрость своими словами. Отвечает по научной базе приложения. Это не врач.</p>

        {turns.map((t, i) => (
          <div key={i} className={t.role === "user" ? "bubble me" : "bubble coachmsg"}>{t.content}</div>
        ))}
        {busy && <div className="bubble coachmsg muted">Думаю…</div>}
        {err && <div className="small" style={{ color: "#f85149" }}>{err}</div>}

        {turns.length === 0 && (
          <div className="chips">
            {HINTS.map((h) => (
              <button key={h} className="chip" onClick={() => send(h)}>{h}</button>
            ))}
          </div>
        )}

        <form className="coach-ask" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="Напиши свой вопрос" aria-label="Вопрос коучу" />
          <button className="chip" type="submit" disabled={busy || !draft.trim()}>Спросить</button>
        </form>
      </div>
    </details>
  );
}
