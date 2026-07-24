import { graphFetch } from "@/lib/graph/client";
import { formatCurrency, formatDate } from "@/lib/labels";

type ReminderBid = {
  bidNumber: string;
  projectName: string;
  client: string;
  dueDate: Date | null;
  estimatedValue: number | null;
};

export async function sendDeadlineReminder(bid: ReminderBid, toEmail: string, accessToken: string) {
  await graphFetch("/me/sendMail", accessToken, {
    method: "POST",
    body: JSON.stringify({
      message: {
        subject: `Bid deadline reminder: ${bid.bidNumber} due ${formatDate(bid.dueDate)}`,
        body: {
          contentType: "Text",
          content:
            `${bid.projectName} (${bid.client}) is due ${formatDate(bid.dueDate)}.\n` +
            `Estimated value: ${formatCurrency(bid.estimatedValue)}.\n\n` +
            `Sent from Bid Tracker.`,
        },
        toRecipients: [{ emailAddress: { address: toEmail } }],
      },
    }),
  });
}

export async function createDueDateEvent(bid: ReminderBid, accessToken: string) {
  if (!bid.dueDate) throw new Error("Bid has no due date to schedule.");

  const start = bid.dueDate.toISOString();
  const end = new Date(bid.dueDate.getTime() + 60 * 60 * 1000).toISOString();

  return graphFetch("/me/events", accessToken, {
    method: "POST",
    body: JSON.stringify({
      subject: `Bid due: ${bid.bidNumber} — ${bid.projectName}`,
      body: {
        contentType: "Text",
        content: `${bid.projectName} for ${bid.client} is due today. Estimated value: ${formatCurrency(bid.estimatedValue)}.`,
      },
      start: { dateTime: start, timeZone: "UTC" },
      end: { dateTime: end, timeZone: "UTC" },
    }),
  });
}
