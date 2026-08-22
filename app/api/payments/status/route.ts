import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymenkuTransaction, paymentFields } from "@/lib/paymenku";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get("orderId");
    if (!id) return NextResponse.json({ error: "orderId wajib diisi" }, { status: 400 });

    const order = await prisma.order.findFirst({ where: { id, userId: user.id } });
    if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    if (order.status !== "PENDING" || !order.providerTrxId) return NextResponse.json({ status: order.status, referenceId: order.referenceId, amount: order.amount, paymentUrl: order.paymentUrl, qrString: order.qrString });

    const remote = await getPaymenkuTransaction(order.providerTrxId);
    const fields = paymentFields(remote);
    const status = fields.status.toLowerCase();

    if (["success", "paid", "settled", "completed"].includes(status)) {
      await prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id: order.id } });
        if (!current || current.status === "PAID") return;
        await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date(), rawResponse: remote } });
        await tx.subscription.create({ data: { userId: order.userId, tierId: order.tierId, status: "ACTIVE", startsAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
      });
      return NextResponse.json({ status: "PAID", referenceId: order.referenceId, amount: order.amount, paymentUrl: order.paymentUrl, qrString: order.qrString });
    }
    if (["failed", "cancelled", "expired"].includes(status)) {
      await prisma.order.update({ where: { id: order.id }, data: { status: status === "expired" ? "EXPIRED" : "FAILED", rawResponse: remote } });
      return NextResponse.json({ status: status === "expired" ? "EXPIRED" : "FAILED", referenceId: order.referenceId, amount: order.amount, paymentUrl: order.paymentUrl, qrString: order.qrString });
    }

    return NextResponse.json({ status: order.status, providerStatus: fields.status, referenceId: order.referenceId, amount: order.amount, paymentUrl: order.paymentUrl, qrString: order.qrString });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Gagal mengecek pembayaran" }, { status: e?.message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
