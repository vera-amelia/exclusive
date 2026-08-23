export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Header from '@/components/Header';
import { prisma } from '@/lib/prisma';
import { rupiah } from '@/lib/format';

export default async function Home() {
  const tiers = await prisma.tier.findMany({
    where: { active: true },
    orderBy: { level: 'asc' },
    include: {
      contents: {
        where: { published: true },
        take: 2,
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { contents: true } },
    },
  });

  const publishedCount = await prisma.content.count({ where: { published: true } });

  return (
    <>
      <Header />
      <main className="site-shell">
        <section className="hero-card">
          <div className="eyebrow"><i className="fas fa-sparkles" /> Exclusive Collection</div>
          <h1 className="serif hero-title">Exclusive<br />Collection</h1>
          <p>Koleksi foto & video premium yang tidak akan kamu temukan di tempat lain.</p>
          <Link href="#collection" className="hero-cta">Lihat Koleksi</Link>
        </section>

        <section className="stats-card">
          <div><strong>4</strong><span>Levels</span></div>
          <div><strong>{publishedCount || 0}</strong><span>Konten</span></div>
          <div><strong>24/7</strong><span>Access</span></div>
        </section>

        <section id="collection" className="collection-section">
          <div className="section-heading">
            <span className="section-kicker">MEMBERSHIP</span>
            <h2 className="serif">Koleksi Eksklusif</h2>
            <p>Pilih paket yang sesuai dengan akses yang kamu inginkan.</p>
          </div>

          <div className="product-list">
            {tiers.map((tier) => {
              const cover = tier.thumbnail;
              const displayName = tier.name.replace(`Level ${tier.level} — `, '');
              return (
                <article key={tier.id} className="product-card">
                  <Link href={`/dashboard/level/${tier.slug}`} className="product-media-link" aria-label={`Lihat ${displayName}`}>
                    <div className="product-media" style={{ background: `linear-gradient(145deg, ${tier.color}, #f6dce7)` }}>
                      {cover ? (
                        <img src={cover} alt="" />
                      ) : (
                        <div className="media-placeholder"><span>V</span></div>
                      )}
                      <div className="media-overlay" />
                      <span className="product-badge"><i className="fas fa-star" /> {tier.level === 1 ? 'New Drop' : tier.level === 4 ? 'Limited' : 'Premium'}</span>
                      <span className="level-chip">LEVEL {tier.level}</span>
                    </div>
                    <div className="content-count"><i className="fas fa-layer-group" /> {tier._count.contents} Konten</div>
                  </Link>
                  <div className="product-body">
                    <h3 className="serif">{displayName}</h3>
                    <p>{tier.description}</p>
                    <div className="price-row">
                      <strong>{rupiah(tier.price)}</strong>
                      <span>/ 30 hari</span>
                    </div>
                    <Link className="buy-button link-button" href={`/dashboard/level/${tier.slug}`}>Beli Sekarang <i className="fas fa-arrow-right" /></Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="trust-row">
          <span><i className="fas fa-lock" /> Aman</span>
          <span><i className="fas fa-bolt" /> Instant</span>
          <span><i className="fas fa-headset" /> Support</span>
          <span><i className="fas fa-circle-check" /> Garansi</span>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-shell footer-inner">
          <div className="serif">Vera Amelia</div>
          <p>Koleksi Digital Eksklusif</p>
          <small>© 2026 Vera Amelia</small>
        </div>
      </footer>
    </>
  );
}
