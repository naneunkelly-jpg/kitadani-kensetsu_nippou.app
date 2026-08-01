import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/self", label: "日報入力" },
  { href: "/admin/reports", label: "日報一覧" },
  { href: "/admin/summary", label: "月次集計" },
  { href: "/admin/employees", label: "従業員管理" },
  { href: "/admin/clients", label: "元請け先管理" },
  { href: "/admin/worksites", label: "現場管理" },
  { href: "/admin/tools", label: "工具管理" },
  { href: "/admin/materials", label: "材料管理" },
  { href: "/admin/holidays", label: "会社カレンダー" },
  { href: "/admin/settings", label: "通知設定" },
];

export function AdminNav() {
  return (
    <nav className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted hover:border-accent hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
