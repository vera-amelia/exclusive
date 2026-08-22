import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function verify(raw: string, signature: string | null) {
  const secret = process.env.PAYMENKU_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature) return false;
  const digest = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const incoming = signature.replace(/^sha256=/, "").trim();
  return incoming.length === digest.length && crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(incoming));
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-paymenku-signature") || req.headers.get("x-signature") || req.headers.get("signature");
  if (!verify(raw, sig)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  try {
    const body = JSON.parse(raw);
    const data = body.data || body;
    const referenceId = data.reference_id || data.referenceId;
    const status = String(data.status || body.status || "").toLowerCase();
    if (!referenceId) return NextResponse.json({ ok: true });

    const order = await prisma.order.findUnique({ where: { referenceId } });
    if (!order) return NextResponse.json({ ok: true });

    if (["success", "paid", "settled", "completed"].includes(status)) {
      await prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id: order.id } });
        if (!current || current.status === "PAID") return;
        await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date(), providerTrxId: data.trx_id || data.id || current.providerTrxId, rawResponse: body } });
        await tx.subscription.create({ data: { userId: current.userId, tierId: current.tierId, status: "ACTIVE", startsAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
      });
    } else if (["failed", "cancelled", "expired"].includes(status)) {
      await prisma.order.update({ where: { id: order.id }, data: { status: status === "expired" ? "EXPIRED" : "FAILED", rawResponse: body } });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Webhook error" }, { status: 400 });
  }
}
