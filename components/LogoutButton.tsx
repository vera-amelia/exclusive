'use client';
export default function LogoutButton(){return <button className="btn btn-ghost" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});location.href='/'}}>Keluar</button>}
