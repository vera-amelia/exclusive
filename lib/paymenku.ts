const baseUrl = process.env.PAYMENKU_BASE_URL || "https://paymenku.com/api/v1";
export async function createPaymenkuTransaction(input: { referenceId: string; amount: number; customerName: string; channelCode?: string }) {
  const key = process.env.PAYMENKU_API_KEY; if (!key) throw new Error("PAYMENKU_API_KEY belum diatur");
  const res = await fetch(`${baseUrl}/transaction/create`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": input.referenceId }, body: JSON.stringify({ channel_code: input.channelCode || "qris3", amount: input.amount, reference_id: input.referenceId, customer_name: input.customerName }), cache: "no-store" });
  const data = await res.json(); if (!res.ok || data?.status === "error") throw new Error(data?.message || "Paymenku transaction failed"); return data;
}
