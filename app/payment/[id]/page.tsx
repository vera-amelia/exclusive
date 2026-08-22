"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { rupiah } from "@/lib/format";

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = async () => {
      const r = await fetch(`/api/payments/status?orderId=${encodeURIComponent(id)}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Gagal memuat pembayaran"); return; }
      setOrder(d);
      if ((d.status === "PAID" || d.status === "FAILED" || d.status === "EXPIRED") && timer) clearInterval(timer);
    };
    load();
    timer = setInterval(load, 5000);
    return () => { if (timer) clearInterval(timer); };
  }, [id]);

  if (error) return <><Header /><main className="container" style={{padding:"60px 0"}}><div className="glass" style={{padding:28,borderRadius:22}}><h1 className="serif">Pembayaran</h1><p>{error}</p><Link className="btn btn-ghost" href="/">Kembali</Link></div></main></>;
  if (!order) return <><Header /><main className="container" style={{padding:"80px 0",textAlign:"center"}}>Memuat pembayaran Paymenku...</main></>;

  return <><Header /><main className="container" style={{padding:"45px 0 80px",maxWidth:620}}>
    <div className="glass shadow-soft" style={{padding:28,borderRadius:24,textAlign:"center"}}>
      <span className="badge">PAYMENKU CHECKOUT</span>
      <h1 className="serif" style={{fontSize:36,margin:"14px 0 5px"}}>Selesaikan Pembayaran</h1>
      <p style={{color:"#8b7c84"}}>Reference: {order.referenceId || id}</p>
      <div style={{fontSize:28,fontWeight:800,color:"#c56f98",margin:"20px 0"}}>{order.amount ? rupiah(order.amount) : ""}</div>
      <div className="badge" style={{marginBottom:18}}>Status: {order.status}</div>
      {order.qrString && <div style={{padding:16,background:"#fff",borderRadius:18,margin:"0 auto 18px",maxWidth:330}}><div style={{fontWeight:700,marginBottom:8}}>QRIS Paymenku</div><div style={{fontSize:12,wordBreak:"break-all",color:"#777"}}>{order.qrString}</div></div>}
      {order.paymentUrl && <a className="btn btn-primary" href={order.paymentUrl} target="_blank" rel="noreferrer">Buka Halaman Pembayaran Paymenku</a>}
      {order.status === "PAID" && <p style={{fontWeight:700,color:"#2f8a5b",marginTop:18}}>Pembayaran berhasil. Akses membership sudah diaktifkan.</p>}
      <div style={{marginTop:22}}><Link className="btn btn-ghost" href="/dashboard">Kembali ke Dashboard</Link></div>
    </div>
  </main></>;
}
