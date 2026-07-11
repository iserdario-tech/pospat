import React, { useState } from "react";
import type { Profile, ScreenerResult, DayLog } from "../index.js";
import { Onboarding } from "./Onboarding.js";
import { Today } from "./Today.js";
import { loadState, saveState, type StoredState } from "./storage.js";

export function App() {
  const [state, setState] = useState<StoredState | null>(() => loadState());
  const [editing, setEditing] = useState(false);

  const saveLog = (log: DayLog) => {
    setState((prev) => {
      if (!prev) return prev;
      const history = [...prev.history.filter((h) => h.date !== log.date), log].slice(-30);
      const next = { ...prev, history };
      saveState(next);
      return next;
    });
  };

  if (!state || editing) {
    return <Onboarding initial={state?.profile} onDone={(profile: Profile, screener: ScreenerResult) => {
      const s: StoredState = { profile, history: state?.history ?? [], screener };
      saveState(s); setState(s); setEditing(false);
    }} />;
  }
  return (
    <>
      {state.screener?.flagged && (
        <div className="wrap" style={{ paddingBottom: 0 }}>
          <div className="flagbox">
            <strong>Важно</strong>
            <ul>{state.screener.messagesRU.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </div>
        </div>
      )}
      <div className="wrap" style={{ paddingBottom: 0 }}>
        <button className="linkbtn" onClick={() => setEditing(true)}>⚙︎ Изменить настройки</button>
      </div>
      <Today profile={state.profile} history={state.history} onLog={saveLog} />
    </>
  );
}
