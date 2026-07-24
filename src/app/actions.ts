"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BidStatus } from "@/generated/prisma/enums";
import { postBidCreatedNotification, postBidStatusChangedNotification } from "@/lib/graph/teams";
import { getGraphAccessToken } from "@/lib/graph/client";
import { attachDocumentToBid, listDocumentLibraryItems } from "@/lib/graph/sharepoint";
import { createDueDateEvent, sendDeadlineReminder } from "@/lib/graph/outlook";

async function currentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function num(formData: FormData, key: string) {
  const value = str(formData, key);
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function date(formData: FormData, key: string) {
  const value = str(formData, key);
  return value ? new Date(value) : null;
}

export async function createBid(formData: FormData) {
  const bidNumber = str(formData, "bidNumber");
  const projectName = str(formData, "projectName");
  const client = str(formData, "client");
  const departmentId = str(formData, "departmentId");
  const ownerId = str(formData, "ownerId");

  if (!bidNumber || !projectName || !client || !departmentId) {
    throw new Error("Bid number, project name, client, and department are required.");
  }

  const bid = await prisma.bid.create({
    data: {
      bidNumber,
      projectName,
      client,
      departmentId,
      ownerId,
      estimatedValue: num(formData, "estimatedValue"),
      dueDate: date(formData, "dueDate"),
      description: str(formData, "description"),
      activities: { create: [{ userId: await currentUserId(), type: "NOTE", message: "Bid created." }] },
    },
  });

  await postBidCreatedNotification(bid);

  revalidatePath("/");
  redirect(`/bids/${bid.id}`);
}

export async function updateBid(bidId: string, formData: FormData) {
  const bidNumber = str(formData, "bidNumber");
  const projectName = str(formData, "projectName");
  const client = str(formData, "client");
  const departmentId = str(formData, "departmentId");

  if (!bidNumber || !projectName || !client || !departmentId) {
    throw new Error("Bid number, project name, client, and department are required.");
  }

  await prisma.bid.update({
    where: { id: bidId },
    data: {
      bidNumber,
      projectName,
      client,
      departmentId,
      ownerId: str(formData, "ownerId"),
      estimatedValue: num(formData, "estimatedValue"),
      dueDate: date(formData, "dueDate"),
      submittedDate: date(formData, "submittedDate"),
      awardDate: date(formData, "awardDate"),
      description: str(formData, "description"),
    },
  });

  revalidatePath("/");
  revalidatePath(`/bids/${bidId}`);
  redirect(`/bids/${bidId}`);
}

export async function changeBidStatus(bidId: string, formData: FormData) {
  const status = str(formData, "status") as BidStatus | null;
  const userId = await currentUserId();
  if (!status || !(status in BidStatus)) {
    throw new Error("Invalid status.");
  }

  const data: { status: BidStatus; submittedDate?: Date; awardDate?: Date } = { status };
  if (status === "SUBMITTED") data.submittedDate = new Date();
  if (status === "WON" || status === "LOST") data.awardDate = new Date();

  const bid = await prisma.bid.update({
    where: { id: bidId },
    data: {
      ...data,
      activities: {
        create: [
          {
            userId,
            type: "STATUS_CHANGE",
            message: `Status changed to ${status.replace(/_/g, " ")}.`,
          },
        ],
      },
    },
  });

  await postBidStatusChangedNotification(bid);

  revalidatePath("/");
  revalidatePath(`/bids/${bidId}`);
}

export async function addBidNote(bidId: string, formData: FormData) {
  const message = str(formData, "message");
  if (!message) return;

  await prisma.bidActivity.create({
    data: { bidId, userId: await currentUserId(), type: "NOTE", message },
  });

  revalidatePath(`/bids/${bidId}`);
}

export async function attachSharePointDocument(bidId: string, formData: FormData) {
  const accessToken = await getGraphAccessToken();
  if (!accessToken) throw new Error("Sign in with Microsoft to attach SharePoint documents.");

  const itemId = str(formData, "itemId");
  const items = await listDocumentLibraryItems(accessToken);
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new Error("Document not found in the configured SharePoint library.");

  await attachDocumentToBid(bidId, item, await currentUserId());
  revalidatePath(`/bids/${bidId}`);
}

export async function sendBidDeadlineReminder(bidId: string) {
  const accessToken = await getGraphAccessToken();
  const session = await auth();
  if (!accessToken || !session?.user?.email) {
    throw new Error("Sign in with Microsoft to send Outlook reminders.");
  }

  const bid = await prisma.bid.findUniqueOrThrow({ where: { id: bidId } });
  await sendDeadlineReminder(bid, session.user.email, accessToken);

  await prisma.bidActivity.create({
    data: {
      bidId,
      userId: session.user.id,
      type: "NOTIFICATION_SENT",
      message: `Deadline reminder emailed to ${session.user.email} via Outlook.`,
    },
  });

  revalidatePath(`/bids/${bidId}`);
}

export async function addBidDueDateToCalendar(bidId: string) {
  const accessToken = await getGraphAccessToken();
  if (!accessToken) throw new Error("Sign in with Microsoft to create calendar events.");

  const bid = await prisma.bid.findUniqueOrThrow({ where: { id: bidId } });
  await createDueDateEvent(bid, accessToken);

  await prisma.bidActivity.create({
    data: {
      bidId,
      userId: await currentUserId(),
      type: "NOTIFICATION_SENT",
      message: "Due date added to Outlook calendar.",
    },
  });

  revalidatePath(`/bids/${bidId}`);
}
