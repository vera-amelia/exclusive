'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyButton({ tierId }: { tierId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return <button className="btn btn-primary" disabled={loading} onClick={async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, channelCode: 'qris3' })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal membuat pembayaran Paymenku');
      if (d.paymentUrl) window.location.href = d.paymentUrl;
      else router.push(`/payment/${d.orderId}`);
    } catch (e: any) {
      alert(e?.message || 'Gagal membuat pembayaran');
      setLoading(false);
    }
  }}>{loading ? 'Menghubungkan Paymenku...' : 'Bayar dengan Paymenku'}</button>;
}
