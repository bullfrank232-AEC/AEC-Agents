import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDueDateIcs } from "@/lib/graph/outlook";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bid = await prisma.bid.findUnique({ where: { id } });

  if (!bid) return new NextResponse("Bid not found", { status: 404 });
  if (!bid.dueDate) return new NextResponse("Bid has no due date", { status: 400 });

  const ics = buildDueDateIcs(bid);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${bid.bidNumber}.ics"`,
    },
  });
}
