import { prisma } from "@/lib/prisma";
import { createBid } from "@/app/actions";
import BidForm from "@/components/BidForm";

export default async function NewBidPage() {
  const [departments, users] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New bid</h1>
      <BidForm action={createBid} departments={departments} users={users} mode="create" />
    </div>
  );
}
