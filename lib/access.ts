import { prisma } from "@/lib/prisma";

export async function getEffectiveTierOrder(userId: string) {
  const now = new Date();

  const active = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: {
        gt: now,
      },
    },
    include: {
      tier: true,
    },
    orderBy: {
      tier: {
        level: "desc",
      },
    },
  });

  return active?.tier.level ?? 0;
}

export async function canAccessTier(
  userId: string,
  tierLevel: number
) {
  return (await getEffectiveTierOrder(userId)) >= tierLevel;
}