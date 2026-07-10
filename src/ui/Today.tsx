import React, { useMemo, useState } from "react";
import type { Profile, DayLog, DayMode, DayToggles } from "../index.js";
import { planDay } from "../index.js";
import { toPlanView } from "./viewModel.js";

export function Today({ profile, history }: { profile: Profile; history: DayLog[] }) {
  const [mode, setMode] = useState<DayMode>("normal");
  const [toggles, setToggles] = useState<DayToggles>({});
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const today = new Date().toISOString().slice(0, 10);

  const view = useMemo(() => {
    const plan = planDay({
      profile,
      ctx: { date: today, mode, ...(mode === "crunch" ? { crunchUntilHM: "27:00" } : {}), toggles },
      lastNight: { wokeHM: profile.anchorWakeHM, quality },
      history,
    });
    return toPlanView(plan);
  }, [profile, history, mode, toggles, quality, today]);

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

      <div className="chips">
        <button className={mode === "normal" ? "chip on" : "chip"} onClick={() => setMode("normal")}>Обычный</button>
        <button className={mode === "crunch" ? "chip on" : "chip"} onClick={() => setMode("crunch")}>Аврал до 03:00</button>
        <button className={mode === "recovery" ? "chip on" : "chip"} onClick={() => setMode("recovery")}>Восстановление</button>
      </div>
      <div className="chips">
        <button className={toggles.napUnavailable ? "chip on" : "chip"} onClick={() => t("napUnavailable")}>Нельзя вздремнуть</button>
        <button className={toggles.noBrightLight ? "chip on" : "chip"} onClick={() => t("noBrightLight")}>Нет света</button>
        <button className={toggles.noCaffeine ? "chip on" : "chip"} onClick={() => t("noCaffeine")}>Без кофеина</button>
      </div>
      <label className="fld small">Как спалось прошлой ночью: {quality}/5
        <input type="range" min={1} max={5} value={quality}
          onChange={e => setQuality(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)} />
      </label>

      <ol className="timeline">
        {view.rows.map((r, i) => (
          <li key={i} className={r.disabled ? "row off" : "row"}>
            <div className="row-time">{r.time}{r.endTime ? `–${r.endTime}` : ""}</div>
            <div className="row-body">
              <div className="row-title">{r.icon} {r.title}</div>
              <div className="row-detail">{r.detail}</div>
              <div className="row-why muted small">{r.why} · {r.refs.join(", ")}</div>
              {r.disabled && r.note && <div className="row-note small">→ {r.note}</div>}
            </div>
          </li>
        ))}
      </ol>

      {view.notes.length > 0 && (
        <ul className="notes small">{view.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      )}
      <p className="disclaimer">Оценка готовности — по твоим данным, не точная «энергия». Не медицинское приложение.</p>
    </main>
  );
}
