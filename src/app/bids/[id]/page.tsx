import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  changeBidStatus,
  addBidNote,
  attachSharePointDocument,
  sendBidDeadlineReminder,
  addBidDueDateToCalendar,
} from "@/app/actions";
import { isOutlookConfigured, isSharePointConfigured } from "@/lib/graph/config";
import { getGraphAccessToken } from "@/lib/graph/client";
import { listDocumentLibraryItems } from "@/lib/graph/sharepoint";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_ORDER,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/lib/labels";

export default async function BidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const bid = await prisma.bid.findUnique({
    where: { id },
    include: {
      department: true,
      owner: true,
      documents: true,
      assignments: { include: { user: true } },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!bid) notFound();

  const changeStatus = changeBidStatus.bind(null, bid.id);
  const addNote = addBidNote.bind(null, bid.id);
  const attachDocument = attachSharePointDocument.bind(null, bid.id);
  const sendReminder = sendBidDeadlineReminder.bind(null, bid.id);
  const addToCalendar = addBidDueDateToCalendar.bind(null, bid.id);

  const sharePointReady = isSharePointConfigured();
  const outlookReady = isOutlookConfigured();
  const accessToken = await getGraphAccessToken();
  const availableDocuments =
    sharePointReady && accessToken ? await listDocumentLibraryItems(accessToken) : [];
  const linkedItemIds = new Set(bid.documents.map((doc) => doc.sharePointItemId));
  const pickableDocuments = availableDocuments.filter((item) => !linkedItemIds.has(item.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-sm text-zinc-400">{bid.bidNumber}</p>
          <h1 className="text-2xl font-semibold text-zinc-900">{bid.projectName}</h1>
          <p className="text-zinc-500">
            {bid.client} · {bid.department.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded border px-2 py-1 text-xs font-medium ${STATUS_COLORS[bid.status]}`}>
            {STATUS_LABELS[bid.status]}
          </span>
          <Link
            href={`/bids/${bid.id}/edit`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700">Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail label="Estimated value" value={formatCurrency(bid.estimatedValue)} />
              <Detail label="Owner" value={bid.owner?.name ?? "Unassigned"} />
              <Detail label="Due date" value={formatDate(bid.dueDate)} />
              <Detail label="Submitted" value={formatDate(bid.submittedDate)} />
              <Detail label="Award date" value={formatDate(bid.awardDate)} />
              <Detail label="Created" value={formatDate(bid.createdAt)} />
            </dl>
            {bid.description && (
              <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-600">{bid.description}</p>
            )}
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700">Documents</h2>
            {bid.documents.length === 0 ? (
              <p className="mb-3 text-sm text-zinc-500">No documents linked yet.</p>
            ) : (
              <ul className="mb-3 flex flex-col gap-2 text-sm">
                {bid.documents.map((doc) => (
                  <li key={doc.id}>
                    <a href={doc.webUrl} className="text-blue-700 underline" target="_blank" rel="noreferrer">
                      {doc.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {!sharePointReady ? (
              <p className="text-sm text-zinc-500">
                Connect SharePoint in{" "}
                <Link href="/settings" className="underline">
                  Settings
                </Link>{" "}
                to attach bid documents here.
              </p>
            ) : !accessToken ? (
              <p className="text-sm text-zinc-500">
                Sign in with Microsoft to browse and attach SharePoint documents.
              </p>
            ) : pickableDocuments.length === 0 ? (
              <p className="text-sm text-zinc-500">No other files found in the document library.</p>
            ) : (
              <form action={attachDocument} className="flex items-center gap-2">
                <select
                  name="itemId"
                  required
                  defaultValue=""
                  className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Select a document to link
                  </option>
                  {pickableDocuments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
                >
                  Attach
                </button>
              </form>
            )}
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700">Activity</h2>
            <form action={addNote} className="mb-4 flex flex-col gap-2">
              <textarea
                name="message"
                required
                rows={2}
                placeholder="Add a note…"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Add note
              </button>
            </form>
            <ul className="flex flex-col gap-3">
              {bid.activities.map((activity) => (
                <li key={activity.id} className="border-t border-zinc-100 pt-3 text-sm">
                  <p className="text-zinc-700">{activity.message}</p>
                  <p className="text-xs text-zinc-400">
                    {activity.user?.name ?? "System"} · {formatDateTime(activity.createdAt)}
                  </p>
                </li>
              ))}
              {bid.activities.length === 0 && (
                <p className="text-sm text-zinc-500">No activity yet.</p>
              )}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {outlookReady && accessToken && (
            <section className="rounded-lg border border-zinc-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-700">Outlook</h2>
              <div className="flex flex-col gap-2">
                <form action={sendReminder}>
                  <button
                    type="submit"
                    className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
                  >
                    Email deadline reminder to me
                  </button>
                </form>
                {bid.dueDate && (
                  <form action={addToCalendar}>
                    <button
                      type="submit"
                      className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
                    >
                      Add due date to my calendar
                    </button>
                  </form>
                )}
              </div>
            </section>
          )}

          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700">Change status</h2>
            <form action={changeStatus} className="flex flex-col gap-2">
              <select
                name="status"
                defaultValue={bid.status}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              >
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Update status
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700">Assigned</h2>
            {bid.assignments.length === 0 ? (
              <p className="text-sm text-zinc-500">No one assigned yet.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm text-zinc-700">
                {bid.assignments.map((assignment) => (
                  <li key={assignment.id}>{assignment.user.name}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="text-zinc-800">{value}</dd>
    </div>
  );
}
