import { NextRequest, NextResponse } from "next/server";
import { getTodayJstYearMonth } from "@/lib/date";
import { getMonthlySummary, type MonthlySummary } from "@/lib/summary";

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
}

function employeeRows(employees: MonthlySummary["employees"]): (string | number)[][] {
  return [
    ["氏名", "出勤日数", "総実働時間", "人日"],
    ...employees.map((e) => [e.employeeName, e.attendanceDays, e.workHours, e.personDays]),
  ];
}

function clientRows(clients: MonthlySummary["clients"]): (string | number)[][] {
  return [
    ["元請け先", "総実働時間", "人日"],
    ...clients.map((c) => [c.clientName, c.workHours, c.personDays]),
  ];
}

function worksiteRows(worksites: MonthlySummary["worksites"]): (string | number)[][] {
  return [
    ["現場", "元請け先", "総実働時間", "人日"],
    ...worksites.map((w) => [w.worksiteName, w.clientName, w.workHours, w.personDays]),
  ];
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const { year: defaultYear, month: defaultMonth } = getTodayJstYearMonth();
  const year = Number(searchParams.get("year")) || defaultYear;
  const month = Number(searchParams.get("month")) || defaultMonth;

  if (!type || !["employee", "client", "worksite", "all"].includes(type)) {
    return NextResponse.json({ error: "typeが不正です" }, { status: 400 });
  }

  const { employees, clients, worksites } = await getMonthlySummary(year, month);

  let rows: (string | number)[][];
  let filenamePart: string;

  if (type === "employee") {
    rows = employeeRows(employees);
    filenamePart = "employee";
  } else if (type === "client") {
    rows = clientRows(clients);
    filenamePart = "client";
  } else if (type === "worksite") {
    rows = worksiteRows(worksites);
    filenamePart = "worksite";
  } else {
    rows = [
      ["従業員別"],
      ...employeeRows(employees),
      [],
      ["元請け先別"],
      ...clientRows(clients),
      [],
      ["現場別"],
      ...worksiteRows(worksites),
    ];
    filenamePart = "all";
  }

  const csvBody = "﻿" + toCsv(rows);
  const filename = `summary-${filenamePart}-${year}-${String(month).padStart(2, "0")}.csv`;

  return new NextResponse(csvBody, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
