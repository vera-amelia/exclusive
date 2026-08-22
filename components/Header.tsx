"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

type User = { name?: string | null; email?: string | null; role?: string; tier?: number | null } | null;

export default function Header(){
  const [user,setUser]=useState<User>(null);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{
    let active=true;
    fetch('/api/auth/me',{cache:'no-store'})
      .then(r=>r.ok?r.json():{user:null})
      .then(d=>{if(active){setUser(d.user ?? null);setLoaded(true);}})
      .catch(()=>{if(active)setLoaded(true);});
    return ()=>{active=false;};
  },[]);
  return <header style={{position:'sticky',top:0,zIndex:30,background:'rgba(255,247,250,.86)',backdropFilter:'blur(14px)',borderBottom:'1px solid #f1e2e8'}}>
    <div className="container" style={{height:72,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <Link href="/" className="serif" style={{fontSize:24,fontStyle:'italic',fontWeight:600}}>Vera Amelia</Link>
      <nav style={{display:'flex',gap:10,alignItems:'center'}}>
        {loaded && user ? <><Link className="btn btn-ghost" href="/dashboard">Dashboard</Link>{user.role==='ADMIN'&&<Link className="btn btn-primary" href="/admin">Admin</Link>}</> : loaded ? <><Link className="btn btn-ghost" href="/login">Masuk</Link><Link className="btn btn-primary" href="/register">Daftar</Link></> : null}
      </nav>
    </div>
  </header>;
}
