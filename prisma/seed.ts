import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const tiers = [
    { name: "Level 1 — Blossom", slug: "level-1", description: "Koleksi awal Vera Amelia", price: 39000, sortOrder: 1, color: "#d98bb3" },
    { name: "Level 2 — Velvet", slug: "level-2", description: "Koleksi premium pilihan", price: 109000, sortOrder: 2, color: "#c77aa2" },
    { name: "Level 3 — Signature", slug: "level-3", description: "Akses koleksi signature", price: 258000, sortOrder: 3, color: "#b86c96" },
    { name: "Level 4 — Private", slug: "level-4", description: "Full access seluruh level", price: 557000, sortOrder: 4, color: "#9e5f83" }
  ];
  for (const tier of tiers) await prisma.tier.upsert({ where: { slug: tier.slug }, update: tier, create: tier });
  const adminEmail = process.env.ADMIN_EMAIL || "admin@veraamelia.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({ where: { email: adminEmail }, update: { role: Role.ADMIN, passwordHash }, create: { name: "Vera Amelia Admin", email: adminEmail, passwordHash, role: Role.ADMIN } });
  console.log(`Admin ready: ${adminEmail}`);
}
main().finally(() => prisma.$disconnect());
