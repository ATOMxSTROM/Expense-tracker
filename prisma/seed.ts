import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

const EXPENSE_CATEGORIES = [
  "Scripting",
  "Video Editing",
  "Software/Subscriptions",
  "Freelancer Payment",
  "Ad Spend",
  "Office/Misc",
];

const INCOME_CATEGORIES = ["Client Payment", "Retainer", "Other Income"];

async function main() {
  for (const name of EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_type: { name, type: "EXPENSE" } },
      update: {},
      create: { name, type: "EXPENSE" },
    });
  }

  for (const name of INCOME_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_type: { name, type: "INCOME" } },
      update: {},
      create: { name, type: "INCOME" },
    });
  }

  console.log("Seeded default categories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
