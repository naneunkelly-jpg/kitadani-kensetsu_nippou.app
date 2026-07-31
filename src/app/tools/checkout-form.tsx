"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { checkoutToolsAction, type ToolActionState } from "./actions";

const initialState: ToolActionState = {};

type Tool = { id: string; name: string; managementNo: string };
type Group = { name: string; units: Tool[] };

export function CheckoutToolsForm({ tools }: { tools: Tool[] }) {
  const [state, formAction, isPending] = useActionState(
    checkoutToolsAction,
    initialState
  );

  const groups = useMemo(() => {
    const map = new Map<string, Tool[]>();
    for (const t of tools) {
      const list = map.get(t.name) ?? [];
      list.push(t);
      map.set(t.name, list);
    }
    return Array.from(map.entries()).map(([name, units]): Group => ({ name, units }));
  }, [tools]);

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleExpanded(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  if (tools.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        持ち出せる工具がありません（すべて持ち出し中か、未登録です）。
      </p>
    );
  }

  return (
    <form
      key={tools.map((t) => t.id).join(",")}
      action={formAction}
      className="space-y-3 rounded-2xl border border-border bg-card p-5"
    >
      <div className="space-y-3">
        {groups.map((g) => {
          const isOpen = expanded.has(g.name);
          const selectedCount = g.units.filter((u) => checkedIds.has(u.id)).length;

          return (
            <div key={g.name}>
              <button
                type="button"
                onClick={() => toggleExpanded(g.name)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-gray-50 px-4 py-3 text-left active:bg-gray-100"
              >
                <span
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white text-base text-muted transition-transform ${
                    isOpen ? "rotate-90" : ""
                  }`}
                >
                  ▶
                </span>
                <span className="flex-1 text-base font-semibold text-foreground">
                  {g.name}
                  <span className="ml-1 text-sm font-normal text-muted">
                    （在庫{g.units.length}）
                  </span>
                  {selectedCount > 0 && (
                    <span className="ml-1 text-xs font-normal text-accent">
                      {selectedCount}件選択中
                    </span>
                  )}
                </span>
              </button>
              {isOpen && (
                <div className="mt-2 flex flex-col gap-2 pl-5">
                  {g.units.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm text-muted">
                      <input
                        type="checkbox"
                        name="toolIds"
                        value={u.id}
                        checked={checkedIds.has(u.id)}
                        onChange={() => toggle(u.id)}
                        className="h-5 w-5"
                      />
                      {u.managementNo ? `#${u.managementNo}` : "番号なし"}
                    </label>
                  ))}
                </div>
              )}
              {!isOpen &&
                g.units
                  .filter((u) => checkedIds.has(u.id))
                  .map((u) => (
                    <input key={u.id} type="hidden" name="toolIds" value={u.id} />
                  ))}
            </div>
          );
        })}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">備考（任意）</label>
        <textarea
          name="note"
          rows={2}
          className="w-full rounded-xl border border-border px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "処理中..." : "持ち出す"}
      </button>
    </form>
  );
}
