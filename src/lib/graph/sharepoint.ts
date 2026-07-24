import { prisma } from "@/lib/prisma";

/**
 * "Attaching" a document just means linking to wherever it already lives
 * (SharePoint, OneDrive, anywhere) — no Graph API browsing, no permissions,
 * no admin consent. Users already have normal access to their own files;
 * this just records the link against the bid.
 */
export async function addDocumentLink(
  bidId: string,
  link: { url: string; label: string },
  userId: string | null
) {
  await prisma.$transaction([
    prisma.bidDocument.create({
      data: {
        bidId,
        fileName: link.label,
        webUrl: link.url,
        uploadedById: userId,
      },
    }),
    prisma.bidActivity.create({
      data: {
        bidId,
        userId,
        type: "DOCUMENT_ADDED",
        message: `Linked document "${link.label}".`,
      },
    }),
  ]);
}
