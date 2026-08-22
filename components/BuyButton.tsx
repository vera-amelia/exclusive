'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyButton({ tierId, label = 'Bayar dengan Paymenku' }: { tierId: string; label?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <button className="buy-button" disabled={loading} onClick={async () => {
      if (loading) return;
      setLoading(true);
      try {
        const r = await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ tierId, channelCode: 'qris3' }),
          cache: 'no-store',
        });

        const text = await r.text();
        let d: any = {};
        try { d = text ? JSON.parse(text) : {}; } catch { d = { error: text || `HTTP ${r.status}` }; }
        if (!r.ok) throw new Error(d.error || `Gagal membuat pembayaran (HTTP ${r.status})`);

        router.push(`/payment/${d.orderId}`);
      } catch (e: any) {
        const message = e?.message === 'Failed to fetch'
          ? 'Server pembayaran tidak dapat dihubungi. Cek Railway Deploy Logs dan pastikan domain HTTPS aktif.'
          : (e?.message || 'Gagal membuat pembayaran. Silakan coba lagi.');
        alert(message);
        setLoading(false);
      }
    }}>
      {loading ? <><i className="fas fa-spinner fa-spin" /> Menghubungkan...</> : <>{label} <i className="fas fa-arrow-right" /></>}
    </button>
  );
}
