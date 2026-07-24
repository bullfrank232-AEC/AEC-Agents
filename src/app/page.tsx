import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUS_COLORS, STATUS_LABELS, STATUS_ORDER, formatCurrency, formatDate } from "@/lib/labels";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department: departmentSlug } = await searchParams;

  const [departments, bids] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.bid.findMany({
      where: departmentSlug ? { department: { slug: departmentSlug } } : undefined,
      include: { department: true, owner: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const bidsByStatus = STATUS_ORDER.map((status) => ({
    status,
    bids: bids.filter((bid) => bid.status === status),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/"
          className={`rounded-full border px-3 py-1 text-sm ${
            !departmentSlug
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
          }`}
        >
          All departments
        </Link>
        {departments.map((dept) => (
          <Link
            key={dept.id}
            href={`/?department=${dept.slug}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              departmentSlug === dept.slug
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {dept.name}
          </Link>
        ))}
      </div>

      {bids.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
          No bids yet.{" "}
          <Link href="/bids/new" className="font-medium text-zinc-900 underline">
            Create the first one
          </Link>
          .
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {bidsByStatus.map(({ status, bids: columnBids }) => (
            <div key={status} className="flex w-72 shrink-0 flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-700">{STATUS_LABELS[status]}</h2>
                <span className="text-xs text-zinc-400">{columnBids.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {columnBids.map((bid) => (
                  <Link
                    key={bid.id}
                    href={`/bids/${bid.id}`}
                    className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-400 hover:shadow"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-zinc-400">{bid.bidNumber}</span>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[bid.status]}`}
                      >
                        {bid.department.name}
                      </span>
                    </div>
                    <p className="font-medium text-zinc-900">{bid.projectName}</p>
                    <p className="text-sm text-zinc-500">{bid.client}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                      <span>{formatCurrency(bid.estimatedValue)}</span>
                      <span>Due {formatDate(bid.dueDate)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
