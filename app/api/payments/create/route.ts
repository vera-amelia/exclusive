import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymenkuTransaction, paymentFields } from "@/lib/paymenku";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { tierId, channelCode } = await req.json();
    const tier = await prisma.tier.findUnique({ where: { id: tierId } });
    if (!tier || !tier.active) return NextResponse.json({ error: "Level tidak tersedia" }, { status: 404 });

    const referenceId = `VA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const trx = await createPaymenkuTransaction({
      referenceId,
      amount: tier.price,
      customerName: user.name,
      channelCode: channelCode || "qris",
    });
    const fields = paymentFields(trx);

    const order = await prisma.order.create({
      data: {
        referenceId,
        providerTrxId: fields.trxId,
        userId: user.id,
        tierId: tier.id,
        amount: tier.price,
        paymentUrl: fields.paymentUrl,
        qrString: fields.qrString,
        rawResponse: trx,
      },
    });

    return NextResponse.json({
      ok: true,
      provider: "Paymenku",
      orderId: order.id,
      referenceId,
      paymentUrl: order.paymentUrl,
      qrString: order.qrString,
    });
  } catch (e: any) {
    const message = e?.message || "Gagal membuat pembayaran";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
