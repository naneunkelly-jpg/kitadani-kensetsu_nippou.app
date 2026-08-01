"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToolUnitForm } from "./add-unit-form";
import { DeleteToolUnitButton } from "./delete-unit-button";

export type ToolUnit = {
  id: string;
  managementNo: string;
  note: string;
  isActive: boolean;
  checkout: { employeeName: string; checkedOutAt: string } | null;
};

export type ToolGroup = {
  name: string;
  units: ToolUnit[];
};

export function ToolGroupList({ groups }: { groups: ToolGroup[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(name: string) {
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

  return (
    <div className="space-y-2">
      {groups.map((g) => {
        const isOpen = expanded.has(g.name);
        const availableCount = g.units.filter((u) => u.isActive && !u.checkout).length;

        return (
          <div key={g.name} className="overflow-hidden rounded-2xl border border-border bg-card">
            <button
              type="button"
              onClick={() => toggle(g.name)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50"
            >
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gray-50 text-base text-muted transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
              <span className="flex-1">
                <span className="font-semibold text-foreground">{g.name}</span>
                <span className="ml-2 text-xs text-muted">計{g.units.length}点</span>
              </span>
              <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-success">
                在庫{availableCount}個
              </span>
            </button>

            {isOpen && (
              <div className="space-y-2 border-t border-border p-4">
                {g.units.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border p-3"
                  >
                    <Link
                      href={`/admin/tools/${u.id}`}
                      className="min-w-0 flex-1 hover:underline"
                    >
                      <p className="font-medium text-foreground">
                        {u.managementNo ? `#${u.managementNo}` : "番号未設定"}
                      </p>
                      {u.note && <p className="truncate text-xs text-muted">{u.note}</p>}
                    </Link>
                    <div className="flex flex-none items-center gap-2">
                      {u.checkout ? (
                        <span className="whitespace-nowrap rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          {u.checkout.employeeName} 持ち出し中
                        </span>
                      ) : (
                        <span className="whitespace-nowrap rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-success">
                          在庫
                        </span>
                      )}
                      {!u.isActive && (
                        <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-muted">
                          無効
                        </span>
                      )}
                      <DeleteToolUnitButton
                        id={u.id}
                        label={`${g.name}${u.managementNo ? ` #${u.managementNo}` : ""}`}
                      />
                    </div>
                  </div>
                ))}

                <AddToolUnitForm name={g.name} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
