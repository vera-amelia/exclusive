'use client';
import {useEffect,useState} from 'react';
import {rupiah} from '@/lib/format';

export default function Tiers(){
  const [items,setItems]=useState<any[]>([]);
  const [editing,setEditing]=useState<any>(null);
  const [busy,setBusy]=useState(false);

  async function load(){
    const r=await fetch('/api/admin/tiers');
    const d=await r.json();
    setItems(Array.isArray(d)?d:[]);
  }
  useEffect(()=>{load()},[]);

  async function save(){
    if(!editing)return;
    setBusy(true);
    try{
      const r=await fetch('/api/admin/tiers/'+editing.id,{
        method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(editing)
      });
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Gagal menyimpan level');
      setEditing(null);
      await load();
    }catch(e:any){alert(e.message)}finally{setBusy(false)}
  }

  return <div>
    <h1 className="serif" style={{fontSize:38}}>Levels & Harga</h1>
    <p style={{color:'#8c7c85',marginTop:-10,marginBottom:22}}>Atur informasi level sekaligus thumbnail yang tampil di kartu dan halaman detail.</p>

    <div style={{display:'grid',gap:12}}>
      {items.map(t=><div key={t.id} className="glass shadow-soft" style={{padding:20,borderRadius:18,display:'flex',justifyContent:'space-between',alignItems:'center',gap:15}}>
        <div style={{display:'flex',alignItems:'center',gap:14,minWidth:0}}>
          <div style={{width:86,height:66,borderRadius:14,overflow:'hidden',background:t.color||'#efd1df',flexShrink:0}}>
            {t.thumbnail ? <img src={t.thumbnail} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/> : <div style={{height:'100%',display:'grid',placeItems:'center',color:'#fff',fontFamily:'Playfair Display,serif',fontSize:30,fontStyle:'italic'}}>V</div>}
          </div>
          <div>
            <div className="badge">LEVEL {t.level}</div>
            <h3 style={{margin:'8px 0 3px'}}>{t.name}</h3>
            <div style={{color:'#c86e9b',fontWeight:800}}>{rupiah(t.price)} / 30 hari</div>
            <small style={{color:'#8c7c85'}}>{t._count?.contents||0} konten • {t._count?.subscriptions||0} subscriber</small>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={()=>setEditing({...t,thumbnail:t.thumbnail||''})}>Edit</button>
      </div>)}
    </div>

    {editing&&<div style={{position:'fixed',inset:0,background:'rgba(20,20,30,.35)',display:'grid',placeItems:'center',zIndex:50,padding:15}}>
      <div className="glass" style={{width:'min(540px,100%)',padding:24,borderRadius:22,maxHeight:'90vh',overflow:'auto'}}>
        <h2 className="serif">Edit {editing.name}</h2>
        <div style={{display:'grid',gap:12}}>
          <input className="input" placeholder="Nama level" value={editing.name||''} onChange={e=>setEditing({...editing,name:e.target.value})}/>
          <textarea className="input" placeholder="Deskripsi" value={editing.description||''} onChange={e=>setEditing({...editing,description:e.target.value})}/>
          <input className="input" type="number" placeholder="Harga" value={editing.price??0} onChange={e=>setEditing({...editing,price:Number(e.target.value)})}/>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,marginBottom:7}}>Thumbnail Level</label>
            <input className="input" placeholder="https://... gambar thumbnail" value={editing.thumbnail||''} onChange={e=>setEditing({...editing,thumbnail:e.target.value})}/>
            <small style={{display:'block',color:'#8c7c85',marginTop:6}}>Gambar ini menjadi cover level di dashboard dan halaman detail. Gunakan URL gambar publik/Cloudinary.</small>
          </div>
          {editing.thumbnail&&<img src={editing.thumbnail} alt="Preview thumbnail" style={{width:'100%',height:180,objectFit:'cover',borderRadius:16}}/>}
          <div style={{display:'flex',gap:10}}>
            <button className="btn btn-primary" disabled={busy} onClick={save}>{busy?'Menyimpan...':'Simpan'}</button>
            <button className="btn btn-ghost" disabled={busy} onClick={()=>setEditing(null)}>Batal</button>
          </div>
        </div>
      </div>
    </div>}
  </div>
}
