"use client";

import { useEffect, useState, useTransition } from "react";
import { subscribePushAction, unsubscribePushAction } from "@/app/push/actions";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Status = "checking" | "unsupported" | "subscribed" | "unsubscribed" | "denied";

export function PushSubscribeToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function check() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "unsubscribed");
    }
    check();
  }, []);

  function handleSubscribe() {
    setError(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus("denied");
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          setError("通知の設定が完了していません。管理者にご連絡ください。");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        const json = subscription.toJSON();

        const result = await subscribePushAction({
          endpoint: json.endpoint!,
          keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        setStatus("subscribed");
      } catch (e) {
        setError(e instanceof Error ? e.message : "通知の登録に失敗しました。");
      }
    });
  }

  function handleUnsubscribe() {
    setError(null);
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();
          await unsubscribePushAction(endpoint);
        }
        setStatus("unsubscribed");
      } catch (e) {
        setError(e instanceof Error ? e.message : "解除に失敗しました。");
      }
    });
  }

  if (status === "checking" || status === "unsupported") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">日報リマインド通知</p>
      <p className="mt-1 text-xs text-muted">
        {status === "subscribed"
          ? "当日の提出リマインドと、翌朝の未提出通知を受け取ります。"
          : status === "denied"
            ? "通知がブロックされています。端末の設定アプリから通知を許可してください。"
            : "当日の提出リマインドと、翌朝の未提出通知を受け取れます。"}
      </p>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {status !== "denied" && (
        <button
          type="button"
          disabled={isPending}
          onClick={status === "subscribed" ? handleUnsubscribe : handleSubscribe}
          className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground disabled:opacity-60"
        >
          {isPending
            ? "処理中..."
            : status === "subscribed"
              ? "通知をオフにする"
              : "通知をオンにする"}
        </button>
      )}
    </div>
  );
}
