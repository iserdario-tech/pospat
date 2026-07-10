import React, { useState } from "react";
import type { Profile, ScreenerResult } from "../index.js";
import { Onboarding } from "./Onboarding.js";
import { Today } from "./Today.js";
import { loadState, saveState, type StoredState } from "./storage.js";

export function App() {
  const [state, setState] = useState<StoredState | null>(() => loadState());

  if (!state) {
    return <Onboarding onDone={(profile: Profile, screener: ScreenerResult) => {
      const s: StoredState = { profile, history: [], screener };
      saveState(s); setState(s);
    }} />;
  }
  return (
    <>
      {state.screener?.flagged && (
        <div className="wrap">
          <div className="flagbox">
            <strong>Важно</strong>
            <ul>{state.screener.messagesRU.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </div>
        </div>
      )}
      <Today profile={state.profile} history={state.history} />
    </>
  );
}
