import React, { useEffect, useMemo, useState } from "react";
import type { Profile, DayLog, DayMode, DayToggles } from "../index.js";
import { planDay, weeklyInsight, streakDays } from "../index.js";
import { toPlanView } from "./viewModel.js";
import { loadDayDraft, saveDayDraft } from "./storage.js";
import { enableNotifications } from "./notifications.js";

// "03:00" после полуночи -> "27:00" (движок считает минуты от полуночи дня)
function crunchStr(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const hh = (h ?? 0) < 12 ? (h ?? 0) + 24 : (h ?? 0);
  return `${hh}:${String(m ?? 0).padStart(2, "0")}`;
}

// склонение: 1 день, 2 дня, 5 дней
function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

export function Today({ profile, history, onLog }: { profile: Profile; history: DayLog[]; onLog: (log: DayLog) => void }) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [draft] = useState(() => loadDayDraft(today)); // контекст дня из прошлого запуска (если за сегодня)
  const [mode, setMode] = useState<DayMode>(draft?.mode ?? "normal");
  const [crunchEndHM, setCrunchEndHM] = useState(draft?.crunchEndHM ?? "03:00");
  const [toggles, setToggles] = useState<DayToggles>(draft?.toggles ?? {});
  const loggedToday = history.find((h) => h.date === today); // уже отмечался сегодня?
  const [wokeHM, setWokeHM] = useState(loggedToday?.wokeHM ?? profile.anchorWakeHM);
  const [bedHM, setBedHM] = useState(loggedToday?.bedHM ?? "");
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(loggedToday?.quality ?? 3);
  const [notifMsg, setNotifMsg] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const notifOn = typeof Notification !== "undefined" && Notification.permission === "granted";

  useEffect(() => { saveDayDraft({ date: today, mode, crunchEndHM, toggles }); }, [today, mode, crunchEndHM, toggles]);

  const view = useMemo(() => {
    const plan = planDay({
      profile,
      ctx: { date: today, mode, ...(mode === "crunch" ? { crunchUntilHM: crunchStr(crunchEndHM) } : {}), toggles },
      lastNight: { wokeHM, quality, ...(bedHM ? { bedHM } : {}) },
      history,
    });
    return toPlanView(plan, nowMin);
  }, [profile, history, mode, crunchEndHM, toggles, wokeHM, bedHM, quality, today, nowMin]);

  const insight = useMemo(() => weeklyInsight(history, today, profile.targetSleepMin), [history, today, profile.targetSleepMin]);
  const streak = useMemo(() => streakDays(history, today), [history, today]);

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

      <button className={notifOn ? "chip on" : "chip"} onClick={async () => setNotifMsg(await enableNotifications(profile))}>
        {notifOn ? "🔔 Напоминания включены" : "🔔 Включить напоминания"}
      </button>
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
      <div className="chips">
        <button className={toggles.hadAlcohol ? "chip on" : "chip"} onClick={() => t("hadAlcohol")}>🍷 Вчера был алкоголь</button>
      </div>
      <div className="morning">
        <div className="small muted" style={{ marginBottom: 4 }}>Утренняя отметка — записывай каждый день, так «регулярность» и «готовность» станут точными.</div>
        <label className="fld small">Во сколько встал сегодня
          <input type="time" value={wokeHM} onChange={e => { setWokeHM(e.target.value); setSavedMsg(""); }} />
        </label>
        <label className="fld small">Во сколько лёг вчера (если помнишь)
          <input type="time" value={bedHM} onChange={e => { setBedHM(e.target.value); setSavedMsg(""); }} />
        </label>
        <label className="fld small">Как спалось: {quality}/5
          <input type="range" min={1} max={5} value={quality}
            onChange={e => { setQuality(Number(e.target.value) as 1 | 2 | 3 | 4 | 5); setSavedMsg(""); }} />
        </label>
        <button className="chip" onClick={() => { onLog({ date: today, wokeHM, quality, ...(bedHM ? { bedHM } : {}), ...(toggles.hadAlcohol ? { hadAlcohol: true } : {}) }); setSavedMsg("Сохранено ✓"); }}>{loggedToday ? "Обновить отметку" : "Записать сегодня"}</button>
        {savedMsg
          ? <span className="small muted" style={{ marginLeft: 8 }}>{savedMsg}</span>
          : loggedToday && <span className="small muted" style={{ marginLeft: 8 }}>Отмечено сегодня ✓</span>}
      </div>

      <section className="week">
        <div className="week-head">
          <b>За неделю</b>
          {streak > 0 && <span className="streak">🔥 {streak} {plural(streak, "день", "дня", "дней")} подряд</span>}
        </div>
        <div className="week-stats small">
          <span>Отмечено: {insight.daysLogged}/7</span>
          {insight.daysLogged >= 2 && <span>Регулярность: {insight.regularity}/100</span>}
          {insight.avgQuality != null && <span>Качество: {insight.avgQuality}/5</span>}
          {insight.avgSleepMin != null && <span>Средний сон: {(insight.avgSleepMin / 60).toFixed(1)} ч</span>}
          {insight.alcoholNights > 0 && <span>🍷 {insight.alcoholNights} {plural(insight.alcoholNights, "ночь", "ночи", "ночей")} с алкоголем</span>}
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>{insight.summaryRU}</div>
      </section>

      {view.nextIdx != null ? (
        <div className="nextup">
          <span className="nextup-label">Сейчас / дальше</span>
          <span className="nextup-body">{view.rows[view.nextIdx]!.icon} {view.rows[view.nextIdx]!.title} · {view.rows[view.nextIdx]!.time}</span>
        </div>
      ) : (
        <div className="nextup"><span className="nextup-body">На сегодня всё — пора отдыхать 🌙</span></div>
      )}

      <ol className="timeline">
        {view.rows.map((r, i) => (
          <li key={i} className={"row" + (r.past ? " past" : "") + (i === view.nextIdx ? " now" : "")}>
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
