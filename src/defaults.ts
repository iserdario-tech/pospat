export const DEFAULTS = {
  targetSleepMin: 465,
  targetSleepMinLo: 420,
  targetSleepMinHi: 540,
  caffeineLargeMg: 300,          // >= это "крупная доза"
  caffeineCutoffLargeH: 8,
  caffeineCutoffModerateH: 6,
  caffeineCutoffRecoveryH: 10,   // день восстановления: ранняя жёсткая отсечка
  caffeineToBedCapMin: 50,       // цель <50 мг к отбою (пометка)
  napTargetMin: 15,              // целевое время сна в напе
  napSlotMin: 20,                // длина окна нап (слот)
  napAfterWakeLoH: 6,
  napAfterWakeHiH: 8,
  napNotLaterBeforeBedH: 9,
  morningLightWindowMin: 60,     // окно "первый час"
  morningLightDoText: "20–30 мин яркого света / на улицу",
  warmShowerBeforeBedMin: 90,
  winddownBeforeBedMin: 60,
  weekendWakeShiftCapMin: 60,
  recoveryCaffeineMaxMgRegular: 400,
  recoveryCaffeineMaxMgNaive: 200,
} as const;
