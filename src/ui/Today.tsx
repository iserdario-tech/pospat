import React, { useMemo, useState } from "react";
import type { Profile, DayLog, DayMode, DayToggles } from "../index.js";
import { planDay } from "../index.js";
import { toPlanView } from "./viewModel.js";
import { enableNotifications } from "./notifications.js";

// "03:00" после полуночи -> "27:00" (движок считает минуты от полуночи дня)
function crunchStr(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const hh = (h ?? 0) < 12 ? (h ?? 0) + 24 : (h ?? 0);
  return `${hh}:${String(m ?? 0).padStart(2, "0")}`;
}

export function Today({ profile, history, onLog }: { profile: Profile; history: DayLog[]; onLog: (log: DayLog) => void }) {
  const [mode, setMode] = useState<DayMode>("normal");
  const [crunchEndHM, setCrunchEndHM] = useState("03:00");
  const [toggles, setToggles] = useState<DayToggles>({});
  const [wokeHM, setWokeHM] = useState(profile.anchorWakeHM);
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notifMsg, setNotifMsg] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const view = useMemo(() => {
    const plan = planDay({
      profile,
      ctx: { date: today, mode, ...(mode === "crunch" ? { crunchUntilHM: crunchStr(crunchEndHM) } : {}), toggles },
      lastNight: { wokeHM, quality },
      history,
    });
    return toPlanView(plan);
  }, [profile, history, mode, crunchEndHM, toggles, wokeHM, quality, today]);

  const t = (k: keyof DayToggles) => setToggles({ ...toggles, [k]: !toggles[k] });

  return (
    <main className="wrap">
      <header className="rd" style={{ borderColor: view.readiness.color }}>
        <div className="rd-dot" style={{ background: view.readiness.color }} />
        <div>
          <strong>{view.readiness.label}</strong>
          <div className="muted small">{view.readiness.whyRU}</div>
          <div className="small">{view.readiness.priorityRU}</div>
        </div>
      </header>

      <button className="chip" onClick={async () => setNotifMsg(await enableNotifications(profile))}>🔔 Включить напоминания</button>
      {notifMsg && <p className="muted small">{notifMsg}</p>}

      <div className="chips">
        <button className={mode === "normal" ? "chip on" : "chip"} onClick={() => setMode("normal")}>Обычный день</button>
        <button className={mode === "crunch" ? "chip on" : "chip"} onClick={() => setMode("crunch")}>Работаю допоздна</button>
        <button className={mode === "recovery" ? "chip on" : "chip"} onClick={() => setMode("recovery")}>Отсыпаюсь</button>
      </div>
      {mode === "crunch" && (
        <label className="fld small">До скольких сегодня работаешь
          <input type="time" value={crunchEndHM} onChange={e => setCrunchEndHM(e.target.value)} />
        </label>
      )}
      <div className="chips">
        <button className={toggles.napUnavailable ? "chip on" : "chip"} onClick={() => t("napUnavailable")}>Нельзя вздремнуть</button>
        <button className={toggles.noBrightLight ? "chip on" : "chip"} onClick={() => t("noBrightLight")}>Нет дневного света</button>
        <button className={toggles.noCaffeine ? "chip on" : "chip"} onClick={() => t("noCaffeine")}>Без кофеина</button>
      </div>
      <div className="morning">
        <div className="small muted" style={{ marginBottom: 4 }}>Утренняя отметка — записывай каждый день, так «регулярность» и «готовность» станут точными.</div>
        <label className="fld small">Во сколько встал сегодня
          <input type="time" value={wokeHM} onChange={e => { setWokeHM(e.target.value); setSavedMsg(""); }} />
        </label>
        <label className="fld small">Как спалось: {quality}/5
          <input type="range" min={1} max={5} value={quality}
            onChange={e => { setQuality(Number(e.target.value) as 1 | 2 | 3 | 4 | 5); setSavedMsg(""); }} />
        </label>
        <button className="chip" onClick={() => { onLog({ date: today, wokeHM, quality }); setSavedMsg("Записано ✓"); }}>Записать сегодня</button>
        {savedMsg && <span className="small muted" style={{ marginLeft: 8 }}>{savedMsg}</span>}
      </div>

      <ol className="timeline">
        {view.rows.map((r, i) => (
          <li key={i} className="row">
            <div className="row-time">{r.time}{r.endTime ? `–${r.endTime}` : ""}</div>
            <div className="row-body">
              <div className="row-title">{r.icon} {r.title}</div>
              <div className="row-detail">{r.detail}</div>
              <div className="row-why muted small">{r.why}</div>
            </div>
          </li>
        ))}
      </ol>

      {view.notes.length > 0 && (
        <ul className="notes small">{view.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      )}

      <details className="tips">
        <summary>💡 Как лучше спать</summary>
        <div className="tips-body">
          <p><b>Спальня:</b> темно (плотные шторы или маска на глаза), прохладно ~18–19&nbsp;°C, тихо (беруши, если шумно), проветри перед сном.</p>
          <p><b>Вечер:</b> приглуши свет за 1–2 часа до сна, тёплый душ, телефон вне кровати, не наедайся тяжёлого за 2–3 часа до сна.</p>
          <p><b>Алкоголь:</b> «бокал на ночь» рушит вторую половину сна — крадёт глубокий и REM-сон, поэтому наутро разбитость. Не пей близко ко сну; если выпил — попей воды, сон будет более рваным.</p>
          <p><b>Похмелье или плохая ночь:</b> относись как к долгу сна — вода, утренний свет, короткий нап днём. Без «лечения» новым алкоголем и без позднего кофе, иначе испортишь и следующую ночь.</p>
          <p><b>Рано просыпаешься и не можешь заснуть:</b> не смотри на часы и в телефон. Не спится больше 20 минут — встань, побудь в тусклом свете, вернись в кровать, когда потянет в сон. Держи комнату тёмной. Если так неделями — стоит показаться врачу.</p>
        </div>
      </details>

      <p className="disclaimer">Оценка готовности — по твоим данным, не точная «энергия». Не медицинское приложение.</p>
    </main>
  );
}
