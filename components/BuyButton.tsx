'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyButton({ tierId, label = 'Bayar dengan Paymenku' }: { tierId: string; label?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <button className="buy-button" disabled={loading} onClick={async () => {
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
        alert(e?.message || 'Gagal membuat pembayaran. Silakan coba lagi.');
        setLoading(false);
      }
    }}>
      {loading ? <><i className="fas fa-spinner fa-spin" /> Menghubungkan...</> : <>{label} <i className="fas fa-arrow-right" /></>}
    </button>
  );
}
