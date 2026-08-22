'use client';
import {useEffect,useState} from 'react';
export default function AdminContent(){const [tiers,setTiers]=useState<any[]>([]),[items,setItems]=useState<any[]>([]),[form,setForm]=useState<any>({title:'',description:'',type:'IMAGE',url:'',thumbnail:'',tierId:'',published:true}),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false);async function load(){const [a,b]=await Promise.all([fetch('/api/admin/tiers').then(r=>r.json()),fetch('/api/admin/content').then(r=>r.json())]);setTiers(a);setItems(b);if(!form.tierId&&a[0])setForm((x:any)=>({...x,tierId:a[0].id}))}useEffect(()=>{load()},[]);async function upload(){
if(!file)return form.url;
if(file.size>100*1024*1024)throw new Error('File terlalu besar. Maksimum 100MB untuk upload langsung. Gunakan URL media untuk file lebih besar.');
let sr:Response;
try{sr=await fetch('/api/upload/signature',{method:'POST'})}catch{throw new Error('Tidak dapat terhubung ke server upload. Pastikan deployment Railway sudah selesai dan coba refresh.')}
const sd=await sr.json().catch(()=>({}));
if(!sr.ok)throw new Error(sd.error||`Gagal menyiapkan upload (${sr.status})`);
const resourceType=file.type.startsWith('video/')?'video':'image';
const fd=new FormData();
fd.append('file',file);
fd.append('api_key',sd.apiKey);
fd.append('timestamp',String(sd.timestamp));
fd.append('folder',sd.folder);
fd.append('signature',sd.signature);
const endpoint=`https://api.cloudinary.com/v1_1/${sd.cloudName}/${resourceType}/upload`;
let r:Response;
try{r=await fetch(endpoint,{method:'POST',body:fd})}catch{throw new Error('Upload ke Cloudinary gagal terhubung. Coba lagi atau periksa koneksi internet.')}
const d=await r.json().catch(()=>({}));
if(!r.ok)throw new Error(d.error?.message||d.error||`Cloudinary upload gagal (${r.status})`);
return d.secure_url;
}async function save(e:any){e.preventDefault();setBusy(true);try{const url=await upload();const r=await fetch('/api/admin/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,url})});const d=await r.json();if(!r.ok)throw new Error(d.error);setForm({...form,title:'',description:'',url:'',thumbnail:''});setFile(null);await load();alert('Konten berhasil ditambahkan')}catch(e:any){alert(e.message)}finally{setBusy(false)}}async function del(id:string){if(!confirm('Hapus konten ini?'))return;await fetch('/api/admin/content/'+id,{method:'DELETE'});load()}return <div><h1 className="serif" style={{fontSize:38}}>Kelola Konten</h1><div className="glass shadow-soft" style={{padding:22,borderRadius:20,maxWidth:760}}><h2 className="serif" style={{fontSize:24,marginTop:0}}>Upload konten baru</h2><form onSubmit={save} style={{display:'grid',gap:12}}><input className="input" placeholder="Judul konten" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/><textarea className="input" placeholder="Deskripsi (opsional)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="IMAGE">Foto</option><option value="VIDEO">Video</option></select><select className="input" value={form.tierId} onChange={e=>setForm({...form,tierId:e.target.value})}>{tiers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div><input type="file" accept={form.type==='IMAGE'?'image/*':'video/*'} onChange={e=>setFile(e.target.files?.[0]||null)}/><div style={{fontSize:12,color:'#8c7c85'}}>Atau masukkan URL media:</div><input className="input" placeholder="https://..." value={form.url} onChange={e=>setForm({...form,url:e.target.value})}/><button className="btn btn-primary" disabled={busy}>{busy?'Mengupload...':'Simpan Konten'}</button></form></div><h2 className="serif" style={{fontSize:28,marginTop:34}}>Semua Konten</h2><div style={{display:'grid',gap:10}}>{items.map(c=><div key={c.id} className="glass" style={{padding:15,borderRadius:16,display:'flex',justifyContent:'space-between',alignItems:'center',gap:15}}><div><b>{c.title}</b><div style={{fontSize:12,color:'#8c7c85'}}>{c.type} • {c.tier?.name}</div></div><button className="btn btn-ghost" onClick={()=>del(c.id)}>Hapus</button></div>)}</div></div>}
