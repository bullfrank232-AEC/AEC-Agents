import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const DEPARTMENTS = [
  { name: "Estimating", slug: "estimating" },
  { name: "Project Management", slug: "project-management" },
  { name: "Engineering", slug: "engineering" },
  { name: "Procurement / Purchasing", slug: "procurement" },
  { name: "Business Development", slug: "business-development" },
];

async function main() {
  const departments = new Map<string, string>();
  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.upsert({
      where: { slug: dept.slug },
      update: { name: dept.name },
      create: dept,
    });
    departments.set(dept.slug, created.id);
  }

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Estimator",
      email: "alice@example.com",
      role: "LEAD",
      departmentId: departments.get("estimating"),
    },
  });

  const priya = await prisma.user.upsert({
    where: { email: "priya@example.com" },
    update: {},
    create: {
      name: "Priya PM",
      email: "priya@example.com",
      role: "MEMBER",
      departmentId: departments.get("project-management"),
    },
  });

  const bidCount = await prisma.bid.count();
  if (bidCount === 0) {
    const bid1 = await prisma.bid.create({
      data: {
        bidNumber: "BID-2026-001",
        projectName: "Riverside Office Tower - Structural Package",
        client: "Riverside Development Group",
        departmentId: departments.get("estimating")!,
        status: "REVIEWING",
        estimatedValue: 4200000,
        dueDate: new Date("2026-08-15"),
        description: "Structural steel and concrete bid package for an 8-story office tower.",
        ownerId: alice.id,
        assignments: { create: [{ userId: alice.id }, { userId: priya.id }] },
        activities: {
          create: [
            { userId: alice.id, type: "NOTE", message: "Initial scope review complete, sent RFI to GC." },
          ],
        },
      },
    });

    await prisma.bid.create({
      data: {
        bidNumber: "BID-2026-002",
        projectName: "Lakeside Elementary School Renovation",
        client: "County School District",
        departmentId: departments.get("project-management")!,
        status: "IDENTIFIED",
        estimatedValue: 950000,
        dueDate: new Date("2026-09-01"),
        description: "Renovation of classroom wing and HVAC upgrade.",
        ownerId: priya.id,
        assignments: { create: [{ userId: priya.id }] },
      },
    });

    console.log(`Seeded departments, users, and bids (e.g. ${bid1.bidNumber}).`);
  } else {
    console.log("Bids already exist, skipping demo bid seed.");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
