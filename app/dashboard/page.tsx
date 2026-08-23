import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import LogoutButton from '@/components/LogoutButton';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { getEffectiveTierOrder } from '@/lib/access';
import { dateId, rupiah } from '@/lib/format';

export default async function Dashboard() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const effective = await getEffectiveTierOrder(user.id);

  const tiers = await prisma.tier.findMany({
    where: { active: true },
    orderBy: { level: 'asc' },
    include: { contents: { where: { published: true }, take: 1, orderBy: { createdAt: 'desc' } }, _count: { select: { contents: true } } },
  });

  const subs = await prisma.subscription.findMany({
    where: { userId: user.id, status: 'ACTIVE', expiresAt: { gt: new Date() } },
    include: { tier: true },
    orderBy: { tier: { level: 'desc' } },
  });

  return <>
    <Header />
    <main className="site-shell dashboard-shell">
      <section className="member-top">
        <div>
          <span className="section-kicker">MEMBER AREA</span>
          <h1 className="serif">Halo, {user.name}</h1>
          <p>Kelola akses dan nikmati koleksi Vera Amelia.</p>
        </div>
        <LogoutButton />
      </section>

      <section className="access-card">
        <div><span>Akses tertinggi kamu</span><strong>{effective ? `Level ${effective}` : 'Belum berlangganan'}</strong></div>
        {subs[0] ? <small>Aktif sampai {subs[0].expiresAt ? dateId(subs[0].expiresAt) : 'Tidak ditentukan'}</small> : <Link href="/#collection">Pilih membership <i className="fas fa-arrow-right" /></Link>}
      </section>

      <section className="collection-section dashboard-collection">
        <div className="section-heading left">
          <span className="section-kicker">YOUR ACCESS</span>
          <h2 className="serif">Koleksi Eksklusif</h2>
          <p>Upgrade level kapan saja untuk membuka lebih banyak koleksi.</p>
        </div>

        <div className="product-list">
          {tiers.map((tier) => {
            const unlocked = tier.level <= effective;
            const cover = tier.thumbnail;
            return <article key={tier.id} className={`product-card ${!unlocked ? 'locked-card' : ''}`}>
              <Link href={`/dashboard/level/${tier.slug}`} className="product-media-link" aria-label={`Lihat ${tier.name}`}>
                <div className="product-media" style={{ background: `linear-gradient(145deg, ${tier.color}, #f6dce7)` }}>
                  {cover ? <img src={cover} alt="" /> : <div className="media-placeholder"><span>V</span></div>}
                  {!unlocked && <div className="locked-overlay"><i className="fas fa-lock" /><span>Premium Only</span></div>}
                  <span className="level-chip">LEVEL {tier.level}</span>
                </div>
                <div className="content-count"><i className="fas fa-layer-group" /> {tier._count.contents} Konten</div>
              </Link>
              <div className="product-body">
                <h3 className="serif">{tier.name.replace(`Level ${tier.level} — `, '')}</h3>
                <p>{unlocked ? 'Akses terbuka untuk akun kamu.' : 'Upgrade ke level ini untuk membuka koleksi.'}</p>
                <div className="price-row"><strong>{rupiah(tier.price)}</strong><span>/ 30 hari</span></div>
                <Link className="buy-button link-button" href={`/dashboard/level/${tier.slug}`}>{unlocked ? 'Lihat Koleksi' : 'Beli Sekarang'} <i className="fas fa-arrow-right" /></Link>
              </div>
            </article>;
          })}
        </div>
      </section>
    </main>
  </>;
}
