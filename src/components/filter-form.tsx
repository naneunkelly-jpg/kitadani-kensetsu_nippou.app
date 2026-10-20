"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const FilterPendingContext = createContext(false);

export function useFilterPending() {
  return useContext(FilterPendingContext);
}

// フォームの submit イベントでpending状態にする。
// 送信ボタンのonClickでdisabledにすると、ブラウザの標準フォーム送信自体が
// キャンセルされてしまう既知の不具合があるため、formのonSubmit側で行う。
export function FilterForm({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form className={className} onSubmit={() => setPending(true)}>
      <FilterPendingContext.Provider value={pending}>{children}</FilterPendingContext.Provider>
    </form>
  );
}
