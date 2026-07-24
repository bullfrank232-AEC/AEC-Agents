import type { BidStatus } from "@/generated/prisma/enums";

export const STATUS_ORDER: BidStatus[] = [
  "IDENTIFIED",
  "REVIEWING",
  "GO_NO_GO",
  "SUBMITTED",
  "WON",
  "LOST",
  "WITHDRAWN",
];

export const STATUS_LABELS: Record<BidStatus, string> = {
  IDENTIFIED: "Identified",
  REVIEWING: "Reviewing",
  GO_NO_GO: "Go / No-Go",
  SUBMITTED: "Submitted",
  WON: "Won",
  LOST: "Lost",
  WITHDRAWN: "Withdrawn",
};

export const STATUS_COLORS: Record<BidStatus, string> = {
  IDENTIFIED: "bg-slate-100 text-slate-700 border-slate-200",
  REVIEWING: "bg-blue-50 text-blue-700 border-blue-200",
  GO_NO_GO: "bg-amber-50 text-amber-700 border-amber-200",
  SUBMITTED: "bg-purple-50 text-purple-700 border-purple-200",
  WON: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOST: "bg-red-50 text-red-700 border-red-200",
  WITHDRAWN: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
