import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import LogoutButton from "@/components/LogoutButton";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getEffectiveTierOrder } from "@/lib/access";
import { dateId } from "@/lib/format";

export default async function Dashboard() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const effective = await getEffectiveTierOrder(user.id);

  const tiers = await prisma.tier.findMany({
    where: {
      active: true,
    },
    orderBy: {
      level: "asc",
    },
  });

  const subs = await prisma.subscription.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      tier: true,
    },
    orderBy: {
      tier: {
        level: "desc",
      },
    },
  });

  return (
    <>
      <Header />

      <main
        className="container"
        style={{
          padding: "35px 0 70px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 25,
          }}
        >
          <div>
            <div className="badge">MEMBER AREA</div>

            <h1
              className="serif"
              style={{
                fontSize: 38,
                margin: "10px 0 3px",
              }}
            >
              Halo, {user.name}
            </h1>

            <p
              style={{
                margin: 0,
                color: "#8b7c84",
              }}
            >
              Kelola akses dan nikmati koleksi Vera Amelia.
            </p>
          </div>

          <LogoutButton />
        </div>

        <div
          className="glass shadow-soft"
          style={{
            borderRadius: 22,
            padding: 22,
            marginBottom: 28,
          }}
        >
          <div style={{ fontWeight: 700 }}>
            Akses tertinggi kamu
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#c56f98",
              margin: "5px 0",
            }}
          >
            {effective
              ? `Level ${effective}`
              : "Belum berlangganan"}
          </div>

          {subs[0] && (
            <div
              style={{
                fontSize: 13,
                color: "#8c7c85",
              }}
            >
              Aktif sampai {subs[0].expiresAt ? dateId(subs[0].expiresAt) : 'Tidak ditentukan'}
            </div>
          )}
        </div>

        <h2
          className="serif"
          style={{
            fontSize: 29,
            fontStyle: "italic",
          }}
        >
          Koleksi Eksklusif
        </h2>

        <div className="grid-cards">
          {tiers.map((tier) => {
            const unlocked =
              tier.level <= effective;

            return (
              <Link
                href={
                  unlocked
                    ? `/dashboard/level/${tier.slug}`
                    : "#"
                }
                key={tier.id}
                style={{
                  pointerEvents: unlocked
                    ? "auto"
                    : "none",
                }}
              >
                <article
                  className="shadow-soft"
                  style={{
                    background: "#fff",
                    borderRadius: 22,
                    overflow: "hidden",
                    height: "100%",
                    opacity: unlocked ? 1 : 0.68,
                  }}
                >
                  <div
                    style={{
                      height: 150,
                      background:
                        "linear-gradient(135deg,#d98bb3,#f8e0e8)",
                      display: "grid",
                      placeItems: "center",
                      color: "#fff",
                      fontSize: 40,
                    }}
                  >
                    {unlocked ? "✦" : "LOCKED"}
                  </div>

                  <div style={{ padding: 17 }}>
                    <span className="badge">
                      LEVEL {tier.level}
                    </span>

                    <h3
                      className="serif"
                      style={{
                        fontSize: 22,
                        margin: "11px 0 5px",
                      }}
                    >
                      {tier.name}
                    </h3>

                    <p
                      style={{
                        fontSize: 13,
                        color: "#8c7c85",
                        margin: 0,
                      }}
                    >
                      {unlocked
                        ? "Akses terbuka"
                        : "Upgrade ke level ini untuk membuka koleksi."}
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}