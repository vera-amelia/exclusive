import { Prisma } from "@prisma/client";

export async function activateOrderSubscription(
  tx: Prisma.TransactionClient,
  orderId: string,
  userId: string,
  tierId: string,
) {
  const existing = await tx.subscription.findUnique({ where: { orderId } });
  if (existing) return existing;

  const now = new Date();
  const latest = await tx.subscription.findFirst({
    where: { userId, expiresAt: { gt: now } },
    orderBy: { expiresAt: "desc" },
  });

  const startsAt = latest?.expiresAt && latest.expiresAt > now ? latest.expiresAt : now;
  const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    return await tx.subscription.create({
      data: {
        orderId,
        userId,
        tierId,
        status: "ACTIVE",
        startsAt,
        expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return tx.subscription.findUnique({ where: { orderId } });
    }
    throw error;
  }
}
