import React, { useState } from "react";
import type { Profile, ScreenerResult, ScreenerAnswers, Chronotype, Goal } from "../index.js";
import { runScreener } from "../index.js";
import { buildProfile, type OnboardingForm } from "./onboardingModel.js";

const emptyScreener: ScreenerAnswers = {
  loudSnoringWithPauses: false, daytimeSleepyDespiteEnoughSleep: false,
  legUrgeToMoveEvening: false, insomnia3xWeek3Months: false, lowMood2Weeks: false, selfHarmThoughts: false,
};

export function Onboarding({ onDone }: { onDone: (p: Profile, s: ScreenerResult) => void }) {
  const [form, setForm] = useState<OnboardingForm>({
    wakeHM: "07:00", bedHM: "23:00", chronotype: "intermediate",
    caffeineMg: 200, caffeineRegular: true, napPossible: true, goal: "alertness",
  });
  const [scr, setScr] = useState<ScreenerAnswers>(emptyScreener);
  const set = (patch: Partial<OnboardingForm>) => setForm({ ...form, ...patch });
  const setS = (patch: Partial<ScreenerAnswers>) => setScr({ ...scr, ...patch });

  return (
    <main className="wrap">
      <h1>Настройка</h1>
      <p className="muted">Пара вопросов — и построим твой план дня.</p>

      <label className="fld">Обычное время подъёма
        <input type="time" value={form.wakeHM} onChange={e=>set({ wakeHM: e.target.value })} />
      </label>
      <label className="fld">Обычное время отбоя
        <input type="time" value={form.bedHM} onChange={e=>set({ bedHM: e.target.value })} />
      </label>
      <label className="fld">Хронотип
        <select value={form.chronotype} onChange={e=>set({ chronotype: e.target.value as Chronotype })}>
          <option value="early">Жаворонок</option>
          <option value="intermediate">Средний</option>
          <option value="late">Сова</option>
        </select>
      </label>
      <label className="fld">Обычная доза кофеина за раз, мг
        <input type="number" min={0} step={50} value={form.caffeineMg}
          onChange={e=>set({ caffeineMg: Number(e.target.value) })} />
      </label>
      <label className="chk"><input type="checkbox" checked={form.caffeineRegular}
        onChange={e=>set({ caffeineRegular: e.target.checked })} /> Пью кофеин ежедневно</label>
      <label className="chk"><input type="checkbox" checked={form.napPossible}
        onChange={e=>set({ napPossible: e.target.checked })} /> Могу вздремнуть днём</label>
      <label className="fld">Главная цель
        <select value={form.goal} onChange={e=>set({ goal: e.target.value as Goal })}>
          <option value="alertness">Бодрость днём</option>
          <option value="less_grogginess">Меньше разбитости</option>
          <option value="regular_schedule">Выстроить режим</option>
        </select>
      </label>

      <h2>Короткий чек здоровья</h2>
      <label className="chk"><input type="checkbox" checked={scr.loudSnoringWithPauses}
        onChange={e=>setS({ loudSnoringWithPauses: e.target.checked })} /> Громкий храп с паузами дыхания</label>
      <label className="chk"><input type="checkbox" checked={scr.daytimeSleepyDespiteEnoughSleep}
        onChange={e=>setS({ daytimeSleepyDespiteEnoughSleep: e.target.checked })} /> Сильно клонит в сон днём даже выспавшись</label>
      <label className="chk"><input type="checkbox" checked={scr.legUrgeToMoveEvening}
        onChange={e=>setS({ legUrgeToMoveEvening: e.target.checked })} /> Неприятные ощущения в ногах по вечерам</label>
      <label className="chk"><input type="checkbox" checked={scr.insomnia3xWeek3Months}
        onChange={e=>setS({ insomnia3xWeek3Months: e.target.checked })} /> Трудности со сном ≥3 ночей/нед ≥3 мес</label>
      <label className="chk"><input type="checkbox" checked={scr.lowMood2Weeks}
        onChange={e=>setS({ lowMood2Weeks: e.target.checked })} /> Сниженное настроение ≥2 недель</label>
      <label className="chk"><input type="checkbox" checked={scr.selfHarmThoughts}
        onChange={e=>setS({ selfHarmThoughts: e.target.checked })} /> Есть мысли о самоповреждении</label>

      <button className="primary" onClick={() => onDone(buildProfile(form), runScreener(scr))}>
        Построить план
      </button>
      <p className="disclaimer">pospat — не медицинское приложение. При нарушениях сна обратись к врачу.</p>
    </main>
  );
}
