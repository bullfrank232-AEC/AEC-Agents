import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateBid } from "@/app/actions";
import BidForm from "@/components/BidForm";

export default async function EditBidPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [bid, departments, users] = await Promise.all([
    prisma.bid.findUnique({ where: { id } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!bid) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit {bid.bidNumber}</h1>
      <BidForm
        action={updateBid.bind(null, bid.id)}
        departments={departments}
        users={users}
        mode="edit"
        defaults={{
          bidNumber: bid.bidNumber,
          projectName: bid.projectName,
          client: bid.client,
          departmentId: bid.departmentId,
          ownerId: bid.ownerId,
          estimatedValue: bid.estimatedValue,
          dueDate: bid.dueDate?.toISOString() ?? null,
          submittedDate: bid.submittedDate?.toISOString() ?? null,
          awardDate: bid.awardDate?.toISOString() ?? null,
          description: bid.description,
        }}
      />
    </div>
  );
}
