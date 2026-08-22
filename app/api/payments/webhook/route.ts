import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { activateOrderSubscription } from "@/lib/subscriptions";
import { isFailedStatus, isPaidStatus, paymentFields } from "@/lib/paymenku";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(raw: string, signature: string | null) {
  const secret = (process.env.PAYMENKU_WEBHOOK_SECRET || "").trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature) return false;

  const incoming = signature.replace(/^sha256=/i, "").trim();
  const hmac = crypto.createHmac("sha256", secret).update(raw).digest();
  const hex = hmac.toString("hex");
  const base64 = hmac.toString("base64");

  const a = Buffer.from(incoming);
  const bHex = Buffer.from(hex);
  const bBase64 = Buffer.from(base64);
  return (a.length === bHex.length && crypto.timingSafeEqual(a, bHex)) ||
    (a.length === bBase64.length && crypto.timingSafeEqual(a, bBase64));
}

function pick(data: any, ...keys: string[]) {
  for (const key of keys) {
    if (data?.[key] !== undefined && data?.[key] !== null && data?.[key] !== "") return data[key];
  }
  return null;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paymenku-signature") || req.headers.get("x-signature") || req.headers.get("signature");

  if (!verifySignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const data = body?.data ?? body;
    const referenceId = pick(data, "reference_id", "referenceId", "merchant_reference", "merchantReference");
    const providerTrxId = pick(data, "trx_id", "transaction_id", "transactionId", "id");
    const rawStatus = String(pick(data, "status", "transaction_status", "payment_status") ?? body?.status ?? "");
    const status = rawStatus.toUpperCase();

    if (!referenceId) return NextResponse.json({ ok: true, ignored: "missing reference_id" });

    const order = await prisma.order.findUnique({ where: { referenceId: String(referenceId) } });
    if (!order) return NextResponse.json({ ok: true, ignored: "unknown reference_id" });

    if (providerTrxId && order.providerTrxId && String(providerTrxId) !== order.providerTrxId) {
      return NextResponse.json({ error: "Transaction ID mismatch" }, { status: 409 });
    }

    const incomingAmount = pick(data, "amount", "gross_amount", "paid_amount");
    if (incomingAmount !== null && Number(incomingAmount) !== order.amount) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 409 });
    }

    if (isPaidStatus(status)) {
      const fields = paymentFields(body);
      await prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id: order.id } });
        if (!current) return;

        if (current.status !== "PAID") {
          await tx.order.update({
            where: { id: current.id },
            data: {
              status: "PAID",
              paidAt: current.paidAt || new Date(),
              providerTrxId: fields.trxId || current.providerTrxId || String(providerTrxId || ""),
              paymentUrl: fields.paymentUrl || current.paymentUrl,
              qrString: fields.qrString || current.qrString,
              rawResponse: body,
            },
          });
        }
        await activateOrderSubscription(tx, current.id, current.userId, current.tierId);
      });
    } else if (isFailedStatus(status)) {
      if (order.status !== "PAID") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: status === "EXPIRED" ? "EXPIRED" : "FAILED", rawResponse: body },
        });
      }
    } else {
      await prisma.order.update({ where: { id: order.id }, data: { rawResponse: body } });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Webhook error" }, { status: 400 });
  }
}
