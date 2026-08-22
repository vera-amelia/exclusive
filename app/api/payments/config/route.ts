import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    const key = (process.env.PAYMENKU_API_KEY || "").trim();
    const base = (process.env.PAYMENKU_BASE_URL || "https://api.paymenku.com/v1").trim().replace(/\/$/, "");
    return NextResponse.json({
      configured: Boolean(key),
      baseUrl: base,
      apiKeyPresent: Boolean(key),
      apiKeyPrefix: key ? key.slice(0, 8) + "…" : null,
      defaultChannel: process.env.PAYMENKU_CHANNEL_CODE || "qris",
      webhookSecretPresent: Boolean((process.env.PAYMENKU_WEBHOOK_SECRET || "").trim()),
    });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "UNAUTHORIZED" }, { status: e?.message === "UNAUTHORIZED" ? 401 : 400 });
  }
}

