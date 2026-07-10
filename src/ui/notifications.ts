// Публичный VAPID-ключ (приватный — на сервере-отправителе, добавим следующим шагом)
const VAPID_PUBLIC = "BPfPCikNLwAyTfK_9aNHSmPU-KAWyTe2rZF_WV29CEJzZU9oyJztXF_WQEtJLt6b7aea9ElXhF8868FI9Wd7T0M";
const BACKEND_URL = ""; // пусто -> подписка пока только сохраняется локально

export function urlBase64ToUint8Array(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function enableNotifications(): Promise<string> {
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
      body: JSON.stringify(sub),
    });
    return "Готово! Напоминания включены.";
  }
  console.log("push subscription:", JSON.stringify(sub));
  return "Разрешение получено ✓ Расписание напоминаний включим следующим шагом.";
}
