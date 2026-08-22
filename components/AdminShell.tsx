"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "./LogoutButton";

const menu = [
  { href: "/admin", label: "Overview", icon: "fa-chart-pie" },
  { href: "/admin/content", label: "Konten", icon: "fa-photo-film" },
  { href: "/admin/tiers", label: "Levels & Harga", icon: "fa-layer-group" },
  { href: "/admin/orders", label: "Pembayaran", icon: "fa-receipt" },
  { href: "/admin/users", label: "Member", icon: "fa-users" },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="admin-layout">
      {open && (
        <button
          className="admin-overlay"
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="admin-brand">
          <div>
            <div className="admin-brand-name serif">Vera Amelia</div>
            <div className="admin-brand-label">ADMIN PANEL</div>
          </div>

          <button
            className="admin-close"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-label">MENU</div>

          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`admin-nav-item ${
                isActive(item.href) ? "active" : ""
              }`}
            >
              <span className="admin-nav-icon">
                <i className={`fa-solid ${item.icon}`} />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-account">
            <div className="admin-avatar">
              <i className="fa-solid fa-user-shield" />
            </div>
            <div>
              <strong>Administrator</strong>
              <small>Vera Amelia</small>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-mobile-header">
          <button
            className="admin-menu-button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            <i className="fa-solid fa-bars" />
          </button>

          <div>
            <div className="admin-mobile-title serif">Vera Amelia</div>
            <div className="admin-mobile-subtitle">ADMIN PANEL</div>
          </div>

          <div className="admin-mobile-user">
            <i className="fa-solid fa-user-shield" />
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
