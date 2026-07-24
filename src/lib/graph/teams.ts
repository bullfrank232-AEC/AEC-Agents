import { isTeamsConfigured } from "./config";
import { formatCurrency, formatDate, STATUS_LABELS } from "@/lib/labels";
import type { BidStatus } from "@/generated/prisma/enums";

type NotifiableBid = {
  id: string;
  bidNumber: string;
  projectName: string;
  client: string;
  status: BidStatus;
  estimatedValue: number | null;
  dueDate: Date | null;
};

async function postToTeams(text: string) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    console.error("Failed to post Teams notification:", error);
  }
}

export async function postBidCreatedNotification(bid: NotifiableBid) {
  if (!isTeamsConfigured()) return;
  await postToTeams(
    `**New bid tracked:** ${bid.bidNumber} — ${bid.projectName} (${bid.client})\n\n` +
      `Estimated value: ${formatCurrency(bid.estimatedValue)}  |  Due: ${formatDate(bid.dueDate)}`
  );
}

export async function postBidStatusChangedNotification(bid: NotifiableBid) {
  if (!isTeamsConfigured()) return;
  await postToTeams(
    `**${bid.bidNumber} — ${bid.projectName}** moved to **${STATUS_LABELS[bid.status]}**`
  );
}
