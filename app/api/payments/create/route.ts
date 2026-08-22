import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymenkuTransaction, paymentFields } from "@/lib/paymenku";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Gagal membuat pembayaran";
  if (message === "UNAUTHORIZED") return NextResponse.json({ error: message }, { status: 401 });
  const status = message.startsWith("Paymenku:") || message.startsWith("Tidak bisa terhubung") || message.startsWith("Paymenku timeout") ? 502 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const tierId = typeof body.tierId === "string" ? body.tierId.trim() : "";
    const channelCode = typeof body.channelCode === "string"
  ? body.channelCode.trim()
  : "qris";

if (channelCode !== "qris")
  return NextResponse.json(
    { error: "Untuk QRIS gunakan channel_code qris" },
    { status: 400 }
  );

    const tier = await prisma.tier.findUnique({ where: { id: tierId } });
    if (!tier || !tier.active) return NextResponse.json({ error: "Level tidak tersedia" }, { status: 404 });
    if (!Number.isInteger(tier.price) || tier.price <= 0) return NextResponse.json({ error: "Harga level tidak valid" }, { status: 400 });

    // Reuse the newest pending order so a retry after a network timeout does not create duplicates.
    const existing = await prisma.order.findFirst({
      where: { userId: user.id, tierId: tier.id, status: "PENDING", amount: tier.price },
      orderBy: { createdAt: "desc" },
    });

    const referenceId = existing?.referenceId || `VA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const order = existing || await prisma.order.create({
      data: {
        referenceId,
        idempotencyKey: referenceId,
        userId: user.id,
        tierId: tier.id,
        amount: tier.price,
        status: "PENDING",
      },
    });

    if (order.providerTrxId && (order.paymentUrl || order.qrString)) {
      return NextResponse.json({
        ok: true,
        provider: "Paymenku",
        orderId: order.id,
        referenceId: order.referenceId,
        paymentUrl: order.paymentUrl,
        qrString: order.qrString,
      });
    }

    try {
      const trx = await createPaymenkuTransaction({
        referenceId: order.referenceId,
        amount: tier.price,
        customerName: user.name,
        channelCode,
      });
      const fields = paymentFields(trx);

      if (!fields.paymentUrl && !fields.qrString) {
        throw new Error("Paymenku: transaksi dibuat tetapi pay_url/qr_string tidak dikirim");
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          providerTrxId: fields.trxId,
          paymentUrl: fields.paymentUrl,
          qrString: fields.qrString,
          rawResponse: trx,
        },
      });

      return NextResponse.json({
        ok: true,
        provider: "Paymenku",
        orderId: updated.id,
        referenceId: updated.referenceId,
        paymentUrl: updated.paymentUrl,
        qrString: updated.qrString,
      });
    } catch (error) {
      await prisma.order.update({
        where: { id: order.id },
        data: { rawResponse: { error: error instanceof Error ? error.message : "Paymenku error" } },
      }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
