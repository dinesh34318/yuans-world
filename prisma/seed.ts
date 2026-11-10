import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL || "file:./dev.db";

function createPrismaClient() {
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
  }
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Create Parent Account ──────────────────────────────────
  const passwordHash = await bcrypt.hash("parent123", 12);
  const parent = await prisma.user.upsert({
    where: { email: "parent@yuansworld.com" },
    update: {},
    create: {
      name: "Parent",
      email: "parent@yuansworld.com",
      passwordHash,
      role: "PARENT",
    },
  });
  console.log("✅ Created parent account:", parent.email);

  // ─── Create Child Account ────────────────────────────────────
  const pinHash = await bcrypt.hash("1234", 10);
  const child = await prisma.child.upsert({
    where: { childId: "yuan123" },
    update: {},
    create: {
      childId: "yuan123",
      name: "Yuan",
      pinHash,
      avatar: "🦁",
      parentId: parent.id,
    },
  });
  console.log("✅ Created child account:", child.childId);

  // ─── Create Rules ────────────────────────────────────────────
  const rules = [
    { title: "No Video Games", description: "Video games are not allowed during the week. Spend your time learning and playing outside!", icon: "🎮", orderIndex: 1 },
    { title: "Limit Screen Time", description: "Avoid excessive mobile phone and television usage. Keep your eyes and mind healthy!", icon: "📱", orderIndex: 2 },
    { title: "Honesty First", description: "Do not edit or filter activity photographs. Always be honest about your activities!", icon: "📸", orderIndex: 3 },
  ];

  for (const rule of rules) {
    const existing = await prisma.rule.findFirst({ where: { title: rule.title, createdById: parent.id } });
    if (!existing) {
      await prisma.rule.create({ data: { ...rule, createdById: parent.id, isActive: true } });
    }
  }
  console.log("✅ Created 3 household rules");

  // ─── Create Activities ──────────────────────────────────────
  const activities = [
    { name: "Study Time", description: "Complete your homework and study for at least 30 minutes", category: "STUDYING", icon: "📚", pointValue: 10 },
    { name: "Read a Book", description: "Read a book for at least 20 minutes", category: "READING", icon: "📖", pointValue: 10 },
    { name: "Outdoor Play", description: "Play outside for at least 30 minutes - run, jump, have fun!", category: "OUTDOOR", icon: "⚽", pointValue: 15 },
    { name: "Help with Chores", description: "Help around the house with cleaning, cooking, or organizing", category: "CHORES", icon: "🏠", pointValue: 10 },
    { name: "Clean Your Room", description: "Keep your room tidy and organized", category: "CLEANLINESS", icon: "✨", pointValue: 10 },
    { name: "Water the Plants", description: "Water the plants in the garden or around the house", category: "CLEANLINESS", icon: "🌱", pointValue: 5 },
    { name: "Practice Writing", description: "Practice writing letters, words, or a short story", category: "STUDYING", icon: "✏️", pointValue: 10 },
  ];

  for (const act of activities) {
    const existing = await prisma.activity.findFirst({ where: { name: act.name, createdById: parent.id } });
    if (!existing) {
      await prisma.activity.create({
        data: { ...act, requiresPhoto: false, requiresApproval: true, isActive: true, createdById: parent.id },
      });
    }
  }
  console.log(`✅ Created ${activities.length} activities`);

  // ─── Assign Activities to Child with Schedules ──────────────
  const allActivities = await prisma.activity.findMany({ where: { createdById: parent.id } });
  const frequencies = ["DAILY", "DAILY", "EVERY_2_DAYS", "DAILY", "EVERY_3_DAYS", "EVERY_2_DAYS", "DAILY"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < allActivities.length; i++) {
    const activity = allActivities[i];
    const freq = frequencies[i] || "DAILY";
    const existingSchedule = await prisma.activitySchedule.findFirst({ where: { activityId: activity.id, childId: child.id, frequency: freq } });
    if (!existingSchedule) {
      await prisma.activitySchedule.create({
        data: { activityId: activity.id, childId: child.id, frequency: freq, startDate: today, endDate: null, isActive: true },
      });
    }
  }
  console.log("✅ Assigned activities to child with schedules");

  // ─── Create Reward Config ───────────────────────────────────
  const existingConfig = await prisma.rewardConfig.findUnique({ where: { parentId: parent.id } });
  if (!existingConfig) {
    await prisma.rewardConfig.create({ data: { parentId: parent.id } });
  }
  console.log("✅ Created reward configuration");

  // ─── Create Notifications ───────────────────────────────────
  await prisma.notification.create({
    data: { userId: parent.id, title: "Welcome to Yuan's World! 🎉", message: "Your account is ready. Start by managing your child's activities and rules.", type: "SYSTEM", isRead: false },
  });
  await prisma.childNotification.create({
    data: { childId: child.id, title: "Welcome to Yuan's World! 🌟", message: "Hi Yuan! Ask your parent to help you log in, then start your adventure!", type: "SYSTEM", isRead: false },
  });

  console.log("\n═══════════════════════════════════════════");
  console.log("  🎉 Seeding complete!");
  console.log("═══════════════════════════════════════════");
  console.log("  Parent Login:");
  console.log("    Email: parent@yuansworld.com");
  console.log("    Password: parent123");
  console.log("  Child Login:");
  console.log("    Child ID: yuan123");
  console.log("    PIN: 1234");
  console.log("═══════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
