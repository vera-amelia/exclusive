import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { getSessionUser } from '@/lib/auth';
import { canAccessTier } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { dateId } from '@/lib/format';

export default async function LevelPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { slug } = await params;
  const tier = await prisma.tier.findUnique({ where: { slug }, include: { contents: { where: { published: true }, orderBy: { createdAt: 'desc' } } } });
  if (!tier) return <><Header /><main className="site-shell empty-state">Level tidak ditemukan.</main></>;
  if (!(await canAccessTier(user.id, tier.level))) redirect('/dashboard');

  return <>
    <Header />
    <main className="site-shell content-shell">
      <Link href="/dashboard" className="back-link"><i className="fas fa-arrow-left" /> Kembali</Link>
      <section className="content-hero">
        <span className="section-kicker">LEVEL {tier.level}</span>
        <h1 className="serif">{tier.name}</h1>
        <p>{tier.description}</p>
      </section>

      {tier.contents.length === 0 ? <div className="empty-card"><i className="fas fa-images" /><h2>Belum ada konten</h2><p>Konten untuk level ini akan muncul di sini setelah admin menambahkannya.</p></div> :
        <div className="content-grid">{tier.contents.map(c => <article key={c.id} className="content-card">
          <div className="content-media">
            {c.type === 'IMAGE' ? <img src={c.url} alt={c.title} /> : <video src={c.url} controls poster={c.thumbnail || undefined} />}
          </div>
          <div className="content-body"><h3 className="serif">{c.title}</h3>{c.description && <p>{c.description}</p>}<small>Ditambahkan {dateId(c.createdAt)}</small></div>
        </article>)}</div>}
    </main>
  </>;
}
