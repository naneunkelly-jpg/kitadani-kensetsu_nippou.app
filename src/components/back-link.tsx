"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

// アプリ内の遷移履歴があればブラウザ履歴で戻る（絞り込み条件やスクロール位置が保持される）。
// 履歴が無い場合（プッシュ通知などから直接開いた場合）は fallbackHref へ通常遷移する。
export function BackLink({
  fallbackHref,
  className,
  ariaLabel,
  children,
}: {
  fallbackHref: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  }

  return (
    <Link href={fallbackHref} onClick={handleClick} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  );
}
