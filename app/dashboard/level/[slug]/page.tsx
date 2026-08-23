import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import BuyButton from '@/components/BuyButton';
import { getSessionUser } from '@/lib/auth';
import { getEffectiveTierOrder } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { dateId, rupiah } from '@/lib/format';

export default async function LevelPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { slug } = await params;
  const tier = await prisma.tier.findUnique({
    where: { slug },
    include: { contents: { where: { published: true }, orderBy: { createdAt: 'desc' } }, _count: { select: { subscriptions: true, contents: true } } }
  });
  if (!tier) return <><Header /><main className="site-shell empty-state">Level tidak ditemukan.</main></>;

  const effective = await getEffectiveTierOrder(user.id);
  const unlocked = tier.level <= effective;
  const gallery = tier.contents.filter(c => c.type === 'IMAGE');
  const cover = tier.thumbnail || gallery[0]?.thumbnail || gallery[0]?.url;
  const preview = gallery.slice(0, 6);
  const buyerCount = tier._count.subscriptions;

  return <>
    <Header />
    <main className="site-shell detail-shell">
      <Link href="/dashboard" className="back-link"><i className="fas fa-arrow-left" /> Kembali</Link>

      <section className="detail-gallery">
        <div className={`detail-main-media ${!unlocked ? 'detail-locked-media' : ''}`} style={{background:`linear-gradient(145deg, ${tier.color || '#d98bb3'}, #f6dce7)`}}>
          {cover ? <img src={cover} alt={tier.name} /> : <div className="media-placeholder"><span>V</span></div>}
          {!unlocked && <div className="detail-premium"><i className="fas fa-lock" /> Premium Only</div>}
        </div>
        {preview.length > 1 && <div className={`detail-thumbs ${!unlocked ? 'detail-thumbs-locked' : ''}`}>
          {preview.map((c,i)=><div key={c.id} className={`detail-thumb ${i===0?'active':''}`}>
            <img src={c.thumbnail || c.url} alt="" />
          </div>)}
        </div>}
        {preview.length > 1 && <div className="detail-dots">{preview.map((c,i)=><span key={c.id} className={i===0?'active':''}/>)}</div>}
      </section>

      <section className="detail-info">
        <span className="detail-badge">✨ New Drop</span>
        <span className="section-kicker">LEVEL {tier.level}</span>
        <div className="detail-content-count"><i className="fas fa-layer-group" /> {tier._count.contents} Konten</div>
        <h1 className="serif">{tier.name.replace(`Level ${tier.level} — `, '')}</h1>
        <div className="detail-price">{rupiah(tier.price)}</div>
        {buyerCount > 0 && <div className="buyer-count"><span>🔥</span> {buyerCount} orang sudah membeli</div>}
        <p className="detail-description">{tier.description || `Paket perkenalan dengan koleksi foto eksklusif berkualitas tinggi. Cocok untuk kamu yang baru pertama kali.`}</p>

        <div className="package-card">
          <strong>📦 Isi Paket:</strong>
          <div>• Set koleksi eksklusif</div>
          <div>• Akses selama 30 hari</div>
          <div>• Update koleksi sesuai level</div>
        </div>

        {unlocked ? <Link href={`/dashboard/level/${tier.slug}#collection`} className="buy-button detail-buy-button">Buka Koleksi <i className="fas fa-arrow-right" /></Link> : <BuyButton tierId={tier.id} label="Beli Sekarang" />}

        <div className="trust-row detail-trust">
          <span>🔒 Aman</span><span>⚡ Instant</span><span>💬 Support</span><span>✅ Garansi</span>
        </div>
      </section>

      <section id="collection" className="detail-content-section">
        <div className="section-heading left">
          <span className="section-kicker">COLLECTION</span>
          <h2 className="serif">Isi Koleksi</h2>
          <p>{unlocked ? 'Semua konten level ini sudah terbuka untuk akun kamu.' : 'Preview koleksi. Beli level ini untuk membuka seluruh konten.'}</p>
        </div>
        {tier.contents.length === 0 ? <div className="empty-card"><i className="fas fa-images" /><h2>Belum ada konten</h2></div> :
          <div className="content-grid">
            {tier.contents.map((c) => {
              const image = c.type === 'IMAGE';
              // Every collection item uses its own Content.thumbnail as the preview.
              // For videos, the thumbnail is the poster; the actual URL is only exposed after unlock.
              const thumbnail = c.thumbnail || (image ? c.url : '');
              return <article key={c.id} className={`content-card ${!unlocked?'preview-locked':''}`}>
                <div className="content-media">
                  {thumbnail ? (image ? (
                    <img src={thumbnail} alt={c.title} />
                  ) : (
                    unlocked ? <video src={c.url} controls poster={thumbnail} /> : <img src={thumbnail} alt={c.title} />
                  )) : (
                    <div className="locked-media"><i className={`fas ${unlocked ? (image ? 'fa-image' : 'fa-video') : 'fa-lock'}`} /><span>{unlocked ? 'Thumbnail belum tersedia' : 'Unlock dengan membeli level ini'}</span></div>
                  )}
                  {!unlocked && <div className="content-lock"><i className="fas fa-lock" /></div>}
                </div>
                <div className="content-body"><h3 className="serif">{c.title}</h3>{c.description && <p>{c.description}</p>}<small>{image ? 'Foto' : 'Video'} · Ditambahkan {dateId(c.createdAt)}</small></div>
              </article>
            })}
          </div>}
      </section>
    </main>
  </>;
}
