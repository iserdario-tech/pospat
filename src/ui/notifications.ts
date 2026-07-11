import type { Profile } from "../index.js";

// Публичный VAPID-ключ (пара к приватному JWK на Worker — см. app/.vapid.json)
const VAPID_PUBLIC = "BPedDaxa5IPF3-WSZ-EyAats5dXnGuJMaLapSRCmElsllWNGFk7NcMyS-z-MEzM5iNtJMtEIxhTEUFqJL81fgo4";
// URL задеплоенного Worker (Cloudflare).
const BACKEND_URL = "https://pospat-push.pospat.workers.dev";

export function urlBase64ToUint8Array(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function enableNotifications(profile: Profile): Promise<string> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    return "Уведомления не поддерживаются этим браузером.";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "Разрешение на уведомления не выдано.";
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
  });
  if (BACKEND_URL) {
    await fetch(BACKEND_URL + "/subscribe", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ subscription: sub, profile, tzOffsetMin: -new Date().getTimezoneOffset() }),
    });
    return "Готово! Напоминания включены.";
  }
  console.log("push subscription:", JSON.stringify(sub));
  return "Разрешение получено ✓ Расписание напоминаний включим следующим шагом.";
}
