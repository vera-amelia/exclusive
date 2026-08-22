const DEFAULT_BASE_URL = "https://api.paymenku.com/v1";
const DEFAULT_QRIS_CHANNEL = "qris3";
const REQUEST_TIMEOUT_MS = 15_000;

function getBaseUrl() {
  return (process.env.PAYMENKU_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/$/, "");
}

function getApiKey() {
  const key = (process.env.PAYMENKU_API_KEY || "").trim();
  if (!key) throw new Error("PAYMENKU_API_KEY belum diatur di Railway");
  return key;
}

function unwrap(data: any) {
  return data?.data ?? data;
}

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function paymenkuFetch(path: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error: any) {
    const cause = error?.cause?.message || error?.cause?.code || "";
    if (error?.name === "AbortError") {
      throw new Error(`Paymenku timeout setelah ${REQUEST_TIMEOUT_MS / 1000} detik`);
    }
    throw new Error(`Tidak bisa terhubung ke Paymenku: ${error?.message || "fetch failed"}${cause ? ` (${cause})` : ""}`);
  } finally {
    clearTimeout(timer);
  }
}

function providerError(data: any, status: number) {
  const root = unwrap(data) || {};
  return String(
    root?.message ||
      root?.error ||
      root?.error_message ||
      data?.message ||
      data?.error ||
      `HTTP ${status}`
  );
}

export async function createPaymenkuTransaction(input: {
  referenceId: string;
  amount: number;
  customerName: string;
  channelCode?: string;
}) {
  const key = getApiKey();
  const channelCode = (input.channelCode || process.env.PAYMENKU_CHANNEL_CODE || DEFAULT_QRIS_CHANNEL).trim();

  const res = await paymenkuFetch("/transaction/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Idempotency-Key": input.referenceId,
    },
    body: JSON.stringify({
      channel_code: channelCode,
      amount: Math.round(input.amount),
      reference_id: input.referenceId,
      customer_name: input.customerName,
    }),
  });

  const data = await readJson(res);
  if (!res.ok || data?.status === "error" || data?.success === false) {
    throw new Error(`Paymenku: ${providerError(data, res.status)}`);
  }

  const fields = paymentFields(data);
  if (!fields.trxId) {
    throw new Error("Paymenku: response tidak mengandung trx_id/transaction_id");
  }

  return data;
}

export async function getPaymenkuTransaction(trxId: string) {
  const key = getApiKey();
  const res = await paymenkuFetch(`/transaction/${encodeURIComponent(trxId)}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(`Paymenku: ${providerError(data, res.status)}`);
  return data;
}

export function paymentFields(trx: any) {
  const data = unwrap(trx) || {};
  return {
    trxId: data.trx_id ?? data.transaction_id ?? data.id ?? null,
    paymentUrl: data.pay_url ?? data.payment_url ?? data.checkout_url ?? data.url ?? null,
    qrString: data.qr_string ?? data.qrString ?? data.qr ?? null,
    status: String(data.status ?? data.transaction_status ?? data.payment_status ?? "PENDING").toUpperCase(),
  };
}

export function isPaidStatus(status: string) {
  return ["SUCCESS", "PAID", "SETTLED", "COMPLETED", "SUCCEEDED"].includes(status.toUpperCase());
}

export function isFailedStatus(status: string) {
  return ["FAILED", "FAILURE", "CANCELLED", "CANCELED", "EXPIRED", "VOID"].includes(status.toUpperCase());
}
