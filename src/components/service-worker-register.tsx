"use client";

import { useEffect } from "react";

/**
 * Service Workerの登録のみを行うコンポーネント。
 * Push通知の購読処理はPhase 7（設定画面）で別途実装する。
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service Worker registration failed:", err);
    });
  }, []);

  return null;
}
