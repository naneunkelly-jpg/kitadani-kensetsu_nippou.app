"use client";

import Link from "next/link";
import { useState } from "react";
import { AddStockForm } from "./add-stock-form";

export type MaterialRowData = {
  id: string;
  name: string;
  unit: string;
  note: string;
  isActive: boolean;
  stock: number;
};

export function MaterialRow({ material }: { material: MaterialRowData }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50"
      >
        <span
          className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gray-50 text-base text-muted transition-transform ${
            open ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-semibold text-foreground">{material.name}</span>
          {material.unit && <span className="ml-2 text-xs text-muted">単位: {material.unit}</span>}
        </span>
        <span
          className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
            material.stock > 0 ? "bg-green-50 text-success" : "bg-red-50 text-danger"
          }`}
        >
          在庫{material.stock}
          {material.unit}
        </span>
        {!material.isActive && (
          <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-muted">
            無効
          </span>
        )}
      </button>

      {open && (
        <div className="space-y-3 border-t border-border p-4">
          {material.note && <p className="text-sm text-muted">{material.note}</p>}
          <Link
            href={`/admin/materials/${material.id}`}
            className="inline-block text-sm text-accent underline-offset-2 hover:underline"
          >
            材料名・単位を編集する
          </Link>
          <AddStockForm materialId={material.id} unit={material.unit} />
        </div>
      )}
    </div>
  );
}
