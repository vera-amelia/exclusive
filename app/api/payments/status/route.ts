import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymenkuTransaction, isFailedStatus, isPaidStatus, paymentFields } from "@/lib/paymenku";
import { activateOrderSubscription } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(order: any, extra: Record<string, unknown> = {}) {
  return {
    status: order.status,
    referenceId: order.referenceId,
    amount: order.amount,
    paymentUrl: order.paymentUrl,
    qrString: order.qrString,
    ...extra,
  };
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get("orderId");
    if (!id) return NextResponse.json({ error: "orderId wajib diisi" }, { status: 400 });

    const order = await prisma.order.findFirst({ where: { id, userId: user.id } });
    if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });

    if (order.status !== "PENDING" || !order.providerTrxId) {
      return NextResponse.json(response(order));
    }

    let remote: any;
    try {
      remote = await getPaymenkuTransaction(order.providerTrxId);
    } catch (error) {
      return NextResponse.json(response(order, {
        providerStatus: "PENDING",
        providerError: error instanceof Error ? error.message : "Gagal menghubungi Paymenku",
      }));
    }

    const fields = paymentFields(remote);
    const providerStatus = fields.status.toUpperCase();

    if (isPaidStatus(providerStatus)) {
      const updated = await prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id: order.id } });
        if (!current) throw new Error("Order tidak ditemukan");

        if (current.status !== "PAID") {
          await tx.order.update({
            where: { id: current.id },
            data: {
              status: "PAID",
              paidAt: current.paidAt || new Date(),
              providerTrxId: fields.trxId || current.providerTrxId,
              paymentUrl: fields.paymentUrl || current.paymentUrl,
              qrString: fields.qrString || current.qrString,
              rawResponse: remote,
            },
          });
        }
        await activateOrderSubscription(tx, current.id, current.userId, current.tierId);
        return tx.order.findUnique({ where: { id: current.id } });
      });
      return NextResponse.json(response(updated));
    }

    if (isFailedStatus(providerStatus)) {
      const failedStatus = ["EXPIRED"].includes(providerStatus) ? "EXPIRED" : "FAILED";
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: failedStatus,
          rawResponse: remote,
          paymentUrl: fields.paymentUrl || order.paymentUrl,
          qrString: fields.qrString || order.qrString,
        },
      });
      return NextResponse.json(response(updated, { providerStatus }));
    }

    return NextResponse.json(response(order, { providerStatus }));
  } catch (error: any) {
    const message = error?.message || "Gagal mengecek pembayaran";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
