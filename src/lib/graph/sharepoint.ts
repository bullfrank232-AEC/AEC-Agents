import { prisma } from "@/lib/prisma";
import { graphFetch } from "@/lib/graph/client";
import { isSharePointConfigured } from "@/lib/graph/config";

export type DriveItem = {
  id: string;
  name: string;
  webUrl: string;
  folder?: unknown;
};

/**
 * Lists files in the configured SharePoint document library so a user can
 * pick one to link to a bid. Requires SHAREPOINT_SITE_ID / SHAREPOINT_DRIVE_ID
 * and a live Graph access token (the signed-in user's Microsoft session).
 */
export async function listDocumentLibraryItems(accessToken: string): Promise<DriveItem[]> {
  if (!isSharePointConfigured()) return [];

  const siteId = process.env.SHAREPOINT_SITE_ID;
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  const data = await graphFetch(
    `/sites/${siteId}/drives/${driveId}/root/children?$select=id,name,webUrl,folder&$top=50`,
    accessToken
  );
  return (data?.value ?? []).filter((item: DriveItem) => !item.folder);
}

export async function attachDocumentToBid(
  bidId: string,
  driveItem: { id: string; name: string; webUrl: string },
  userId: string | null
) {
  await prisma.$transaction([
    prisma.bidDocument.create({
      data: {
        bidId,
        sharePointItemId: driveItem.id,
        fileName: driveItem.name,
        webUrl: driveItem.webUrl,
        uploadedById: userId,
      },
    }),
    prisma.bidActivity.create({
      data: {
        bidId,
        userId,
        type: "DOCUMENT_ADDED",
        message: `Linked SharePoint document "${driveItem.name}".`,
      },
    }),
  ]);
}
