"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BidStatus } from "@/generated/prisma/enums";
import { postBidCreatedNotification, postBidStatusChangedNotification } from "@/lib/graph/teams";
import { addDocumentLink } from "@/lib/graph/sharepoint";

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

export async function addBidDocumentLink(bidId: string, formData: FormData) {
  const url = str(formData, "url");
  const label = str(formData, "label");
  if (!url) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Enter a valid document link (starting with https://).");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Enter a valid document link (starting with https://).");
  }

  const fallbackLabel = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() ?? url);
  await addDocumentLink(bidId, { url, label: label ?? fallbackLabel }, await currentUserId());

  revalidatePath(`/bids/${bidId}`);
}
