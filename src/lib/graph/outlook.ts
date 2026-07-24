import { formatCurrency, formatDate } from "@/lib/labels";

type ReminderBid = {
  bidNumber: string;
  projectName: string;
  client: string;
  dueDate: Date | null;
  estimatedValue: number | null;
};

/**
 * These build plain mailto: links and .ics files instead of calling the
 * Graph API — no sign-in scopes, no admin consent, no configuration. They
 * just hand off to whatever mail/calendar app is already installed.
 */
export function buildReminderMailto(bid: ReminderBid, toEmail: string) {
  const subject = encodeURIComponent(
    `Bid deadline reminder: ${bid.bidNumber} due ${formatDate(bid.dueDate)}`
  );
  const body = encodeURIComponent(
    `${bid.projectName} (${bid.client}) is due ${formatDate(bid.dueDate)}.\n` +
      `Estimated value: ${formatCurrency(bid.estimatedValue)}.`
  );
  return `mailto:${encodeURIComponent(toEmail)}?subject=${subject}&body=${body}`;
}

function toIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string) {
  return text.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}

export function buildDueDateIcs(bid: ReminderBid & { id: string }) {
  if (!bid.dueDate) throw new Error("Bid has no due date to schedule.");

  const start = toIcsDate(bid.dueDate);
  const end = toIcsDate(new Date(bid.dueDate.getTime() + 60 * 60 * 1000));
  const summary = escapeIcsText(`Bid due: ${bid.bidNumber} — ${bid.projectName}`);
  const description = escapeIcsText(
    `${bid.projectName} for ${bid.client} is due today. Estimated value: ${formatCurrency(bid.estimatedValue)}.`
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bid Tracker//EN",
    "BEGIN:VEVENT",
    `UID:${bid.id}@bid-tracker`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
