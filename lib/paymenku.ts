const baseUrl = (process.env.PAYMENKU_BASE_URL || "https://api.paymenku.com/v1").trim().replace(/\/$/, "");

function unwrap(data: any) {
  return data?.data ?? data;
}

export async function createPaymenkuTransaction(input: {
  referenceId: string;
  amount: number;
  customerName: string;
  channelCode?: string;
}) {
  const key = (process.env.PAYMENKU_API_KEY || "").trim();
  if (!key) throw new Error("PAYMENKU_API_KEY belum diatur di Railway");

  const res = await fetch(`${baseUrl}/transaction/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.referenceId,
    },
    body: JSON.stringify({
      channel_code: input.channelCode || process.env.PAYMENKU_CHANNEL_CODE || "qris3",
      amount: input.amount,
      reference_id: input.referenceId,
      customer_name: input.customerName,
    }),
    cache: "no-store",
  });

  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { message: text }; }

  if (!res.ok || data?.status === "error" || data?.success === false) {
    const message = data?.message || data?.error || data?.data?.message || `Paymenku HTTP ${res.status}`;
    throw new Error(`Paymenku: ${message}`);
  }
  return data;
}

export async function getPaymenkuTransaction(trxId: string) {
  const key = (process.env.PAYMENKU_API_KEY || "").trim();
  if (!key) throw new Error("PAYMENKU_API_KEY belum diatur di Railway");
  const res = await fetch(`${baseUrl}/transaction/${encodeURIComponent(trxId)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `Paymenku HTTP ${res.status}`);
  return unwrap(data);
}

export function paymentFields(trx: any) {
  const data = unwrap(trx) || {};
  return {
    trxId: data.trx_id ?? data.transaction_id ?? data.id ?? null,
    paymentUrl: data.pay_url ?? data.payment_url ?? data.checkout_url ?? data.url ?? null,
    qrString: data.qr_string ?? data.qrString ?? data.qr ?? null,
    status: String(data.status ?? "PENDING").toUpperCase(),
  };
}
