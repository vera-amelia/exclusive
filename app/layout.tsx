import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title:'Vera Amelia — Exclusive Collection', description:'Membership platform Vera Amelia' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
