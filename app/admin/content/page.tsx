'use client';
import {useEffect,useState} from 'react';

type ContentItem={id:string;title:string;description?:string|null;type:'IMAGE'|'VIDEO';url:string;thumbnail?:string|null;tierId:string;tier?:{name:string};published:boolean};

export default function AdminContent(){
  const [tiers,setTiers]=useState<any[]>([]),[items,setItems]=useState<ContentItem[]>([]);
  const [form,setForm]=useState<any>({title:'',description:'',type:'IMAGE',url:'',thumbnail:'',tierId:'',published:true});
  const [file,setFile]=useState<File|null>(null),[thumbFile,setThumbFile]=useState<File|null>(null);
  const [thumbPreview,setThumbPreview]=useState(''),[busy,setBusy]=useState(false),[editingId,setEditingId]=useState<string|null>(null);
  const editing=Boolean(editingId);

  async function load(){
    const [a,b]=await Promise.all([fetch('/api/admin/tiers').then(r=>r.json()),fetch('/api/admin/content').then(r=>r.json())]);
    setTiers(a);setItems(b);
    if(!form.tierId&&a[0])setForm((x:any)=>({...x,tierId:a[0].id}));
  }
  useEffect(()=>{load()},[]);
  useEffect(()=>()=>{if(thumbPreview)URL.revokeObjectURL(thumbPreview)},[thumbPreview]);

  function resetForm(){
    if(thumbPreview)URL.revokeObjectURL(thumbPreview);
    setEditingId(null);setFile(null);setThumbFile(null);setThumbPreview('');
    setForm((x:any)=>({title:'',description:'',type:'IMAGE',url:'',thumbnail:'',tierId:x.tierId||(tiers[0]?.id||''),published:true}));
  }

  function handleThumbnailChange(e:React.ChangeEvent<HTMLInputElement>){
    const selected=e.target.files?.[0]||null;
    if(!selected){setThumbFile(null);setThumbPreview(editingId?form.thumbnail:'');return}
    if(!selected.type.startsWith('image/')){alert('Thumbnail wajib berupa gambar (JPG, PNG, WEBP, dll).');e.target.value='';return}
    if(selected.size>10*1024*1024){alert('Ukuran thumbnail maksimal 10MB.');e.target.value='';return}
    if(thumbPreview)URL.revokeObjectURL(thumbPreview);
    setThumbFile(selected);setThumbPreview(URL.createObjectURL(selected));
  }

  async function uploadToCloudinary(selected:File,resourceType:'image'|'video'){
    if(selected.size>100*1024*1024)throw new Error('File terlalu besar. Maksimum 100MB untuk upload langsung. Gunakan URL media untuk file lebih besar.');
    let sr:Response;
    try{sr=await fetch('/api/upload/signature',{method:'POST'})}catch{throw new Error('Tidak dapat terhubung ke server upload. Pastikan deployment Railway sudah selesai dan coba refresh.')}
    const sd=await sr.json().catch(()=>({}));
    if(!sr.ok)throw new Error(sd.error||`Gagal menyiapkan upload (${sr.status})`);
    const fd=new FormData();
    fd.append('file',selected);fd.append('api_key',sd.apiKey);fd.append('timestamp',String(sd.timestamp));fd.append('folder',sd.folder);fd.append('signature',sd.signature);
    const endpoint=`https://api.cloudinary.com/v1_1/${sd.cloudName}/${resourceType}/upload`;
    let r:Response;
    try{r=await fetch(endpoint,{method:'POST',body:fd})}catch{throw new Error('Upload ke Cloudinary gagal terhubung. Coba lagi atau periksa koneksi internet.')}
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error?.message||d.error||`Cloudinary upload gagal (${r.status})`);
    return d.secure_url as string;
  }

  function startEdit(c:ContentItem){
    if(thumbPreview)URL.revokeObjectURL(thumbPreview);
    setEditingId(c.id);setFile(null);setThumbFile(null);setThumbPreview(c.thumbnail||'');
    setForm({title:c.title,description:c.description||'',type:c.type,url:c.url,thumbnail:c.thumbnail||'',tierId:c.tierId,published:c.published});
    window.scrollTo({top:0,behavior:'smooth'});
  }

  async function save(e:any){
    e.preventDefault();
    if(!thumbFile&&!form.thumbnail){alert('Thumbnail wajib ada. Upload thumbnail sebelum menyimpan konten.');return}
    if(!file&&!form.url){alert('Upload file konten atau masukkan URL media.');return}
    setBusy(true);
    try{
      const thumbnail=thumbFile?await uploadToCloudinary(thumbFile,'image'):form.thumbnail;
      const url=file?await uploadToCloudinary(file,file.type.startsWith('video/')?'video':'image'):form.url;
      const payload={...form,url,thumbnail};
      const endpoint=editingId?`/api/admin/content/${editingId}`:'/api/admin/content';
      const r=await fetch(endpoint,{method:editingId?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const d=await r.json();if(!r.ok)throw new Error(d.error||`Gagal ${editingId?'mengubah':'menyimpan'} konten`);
      await load();resetForm();alert(editingId?'Konten berhasil diperbarui':'Konten berhasil ditambahkan');
    }catch(e:any){alert(e.message)}finally{setBusy(false)}
  }
  async function del(id:string){if(!confirm('Hapus konten ini?'))return;const r=await fetch('/api/admin/content/'+id,{method:'DELETE'});if(!r.ok){const d=await r.json().catch(()=>({}));alert(d.error||'Gagal menghapus konten');return}if(editingId===id)resetForm();load()}

  return <div>
    <h1 className="serif" style={{fontSize:38}}>Kelola Konten</h1>
    <div className="glass shadow-soft" style={{padding:22,borderRadius:20,maxWidth:760}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12}}>
        <h2 className="serif" style={{fontSize:24,margin:0}}>{editing?'Edit konten':'Upload konten baru'}</h2>
        {editing&&<button type="button" className="btn btn-ghost" onClick={resetForm}>Batal Edit</button>}
      </div>
      <form onSubmit={save} style={{display:'grid',gap:12}}>
        <input className="input" placeholder="Judul konten" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
        <textarea className="input" placeholder="Deskripsi (opsional)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="IMAGE">Foto</option><option value="VIDEO">Video</option></select>
          <select className="input" value={form.tierId} onChange={e=>setForm({...form,tierId:e.target.value})}>{tiers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
        </div>

        <div className="glass" style={{padding:14,borderRadius:14,border:'1px solid rgba(184,108,150,.25)'}}>
          <div style={{fontWeight:700,marginBottom:5}}>Thumbnail Konten <span style={{color:'#b86c96'}}>* Wajib</span></div>
          <div style={{fontSize:12,color:'#8c7c85',marginBottom:10}}>{editing?'Pilih gambar baru untuk mengganti thumbnail, atau biarkan thumbnail lama tetap digunakan.':'Upload gambar yang akan tampil di Isi Koleksi. Maksimal 10MB.'}</div>
          <input type="file" accept="image/*" onChange={handleThumbnailChange} required={!editing&&!form.thumbnail}/>
          {thumbPreview&&<div style={{marginTop:12}}><div style={{fontSize:12,color:'#8c7c85',marginBottom:6}}>{thumbFile?'Preview thumbnail baru:':'Thumbnail saat ini:'}</div><div style={{width:'100%',maxWidth:320,aspectRatio:'16/9',borderRadius:12,overflow:'hidden',background:'#f3edf1'}}><img src={thumbPreview} alt="Preview thumbnail" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/></div></div>}
        </div>

        <div>
          <div style={{fontSize:12,color:'#8c7c85',marginBottom:6}}>File media utama: {editing&&'(opsional — kosongkan jika tidak ingin mengganti)'}</div>
          <input type="file" accept={form.type==='IMAGE'?'image/*':'video/*'} onChange={e=>setFile(e.target.files?.[0]||null)}/>
          <div style={{fontSize:12,color:'#8c7c85',marginTop:7}}>Atau masukkan URL media:</div>
          <input className="input" placeholder="https://..." value={form.url} onChange={e=>setForm({...form,url:e.target.value})}/>
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy?(editing?'Menyimpan perubahan...':'Mengupload thumbnail & konten...'):(editing?'Simpan Perubahan':'Simpan Konten')}</button>
      </form>
    </div>

    <h2 className="serif" style={{fontSize:28,marginTop:34}}>Semua Konten</h2>
    <div style={{display:'grid',gap:10}}>{items.map(c=><div key={c.id} className="glass" style={{padding:15,borderRadius:16,display:'flex',justifyContent:'space-between',alignItems:'center',gap:15}}>
      <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
        {c.thumbnail?<img src={c.thumbnail} alt="" style={{width:72,height:48,objectFit:'cover',borderRadius:9,flex:'0 0 auto'}}/>:<div style={{width:72,height:48,borderRadius:9,background:'#eee7eb',display:'grid',placeItems:'center',fontSize:11,color:'#8c7c85',flex:'0 0 auto'}}>No thumb</div>}
        <div style={{minWidth:0}}><b>{c.title}</b><div style={{fontSize:12,color:'#8c7c85'}}>{c.type} • {c.tier?.name}</div></div>
      </div>
      <div style={{display:'flex',gap:8,flex:'0 0 auto'}}><button className="btn btn-ghost" onClick={()=>startEdit(c)}>Edit</button><button className="btn btn-ghost" onClick={()=>del(c.id)}>Hapus</button></div>
    </div>)}</div>
  </div>
}
