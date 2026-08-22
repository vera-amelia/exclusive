import { prisma } from "./prisma";
export async function getEffectiveTierOrder(userId: string) { const now = new Date(); const active = await prisma.subscription.findFirst({ where: { userId, status: "ACTIVE", expiresAt: { gt: now } }, include: { tier: true }, orderBy: { tier: { sortOrder: "desc" } } }); return active?.tier.sortOrder ?? 0; }
export async function canAccessTier(userId: string, tierSortOrder: number) { return (await getEffectiveTierOrder(userId)) >= tierSortOrder; }
