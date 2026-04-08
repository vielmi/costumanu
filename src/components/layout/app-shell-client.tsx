"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/layout/app-logo";

type NavItem = { label: string; href: string; icon: string; badgeKey?: string; adminOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: "Home",         href: "/",                             icon: "icon-home-menu"       },
  { label: "Kostüme",      href: "/fundus",                       icon: "icon-shirt"           },
  { label: "Aufführungen", href: "/auffuehrungen",                icon: "icon-production-menu" },
  { label: "Darsteller",   href: "/darsteller",                   icon: "icon-artist-menu"     },
  { label: "Termine",      href: "/termine",                      icon: "icon-calendar-menu"   },
  { label: "Kontakte",     href: "/kontakte",                     icon: "icon-contact-book"    },
  { label: "Nachrichten",  href: "/messages",   badgeKey: "messages", icon: "icon-chat"        },
  { label: "Ausleihen",    href: "/rental",     badgeKey: "rentals",  icon: "icon-shopping-bag"},
];

const ADMIN_NAV_ITEM: NavItem = {
  label: "Konfiguration", href: "/einstellungen/konfiguration", icon: "icon-setting",
};

const SIDEBAR_W = 209;
const SIDEBAR_COLLAPSED_W = 64;

interface Props {
  children: React.ReactNode;
  userRole: string;
  unreadMessages: number;
  pendingRentals: number;
}

export function AppShellClient({ children, userRole, unreadMessages, pendingRentals }: Props) {
  const isAdmin = userRole === "owner" || userRole === "admin";
  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  function getBadge(key?: string) {
    if (key === "messages") return unreadMessages;
    if (key === "rentals")  return pendingRentals;
    return 0;
  }

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "var(--page-bg)", overflow: "hidden", paddingTop: 20,
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", flexShrink: 0,
        background: "var(--page-bg)", height: 72,
      }}>
        <div style={{
          width: sidebarW, flexShrink: 0,
          display: "flex", alignItems: "center",
          padding: collapsed ? "0 12px" : "0 12px 0 20px", gap: 8,
          transition: "width 200ms ease", overflow: "hidden",
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
          {!collapsed && <AppLogo />}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Sidebar öffnen" : "Sidebar schliessen"}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--neutral-grey-600)",
              fontFamily: "var(--font-family-base)", fontSize: 16, fontWeight: 700,
              flexShrink: 0, opacity: 0.3,
            }}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: "20px 12px 12px", gap: 12 }}>

        {/* Sidebar */}
        <nav style={{
          width: sidebarW, flexShrink: 0,
          background: "transparent", display: "flex", flexDirection: "column",
          transition: "width 200ms ease",
        }}>
          <div style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const badge = getBadge(item.badgeKey);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex", alignItems: "center",
                    width: collapsed ? undefined : 166,
                    height: 50, padding: "0 12px", gap: 10,
                    borderRadius: 8,
                    background: isActive ? "#D6DFDD" : "transparent",
                    textDecoration: "none",
                    borderBottom: index < navItems.length - 1 ? "1px solid var(--secondary-500)" : "none",
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                >
                  <Image src={`/icons/${item.icon}.svg`} alt={item.label} width={20} height={20} style={{ flexShrink: 0 }} />
                  {!collapsed && (
                    <>
                      <span style={{
                        fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
                        fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-600)",
                        flex: 1, whiteSpace: "nowrap", letterSpacing: "0.01em",
                      }}>
                        {item.label}
                      </span>
                      {badge > 0 && (
                        <span style={{
                          minWidth: 22, height: 22,
                          background: "var(--neutral-grey-600)", borderRadius: 103,
                          fontSize: 10, fontWeight: 700, color: "#FFFFFF",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          padding: "0 5px", flexShrink: 0, fontFamily: "var(--font-family-base)",
                        }}>
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Profil-Footer */}
          <div style={{
            padding: "8px 8px 8px 12px", borderTop: "1px solid var(--neutral-grey-200)",
            flexShrink: 0, minHeight: 99, display: "flex", alignItems: "center",
          }}>
            <Link href="/profile" style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "0 8px",
              borderRadius: "var(--radius-sm)", textDecoration: "none",
              justifyContent: collapsed ? "center" : "flex-start",
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "var(--secondary-700)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, overflow: "hidden",
              }}>
                <Image src="/icons/icon-avatar.svg" alt="" width={28} height={28} style={{ filter: "invert(1)" }} />
              </div>
              {!collapsed && (
                <>
                  <span style={{
                    fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
                    fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-600)",
                    flex: 1, whiteSpace: "nowrap",
                  }}>
                    Mein Profil
                  </span>
                  <Image src="/icons/icon-arrow-dropdown-down.svg" alt="" width={16} height={16} style={{ flexShrink: 0 }} />
                </>
              )}
            </Link>
          </div>
        </nav>

        {/* Content — weisses Card */}
        <main style={{
          flex: 1, overflowY: "auto",
          background: "#FFFFFF", borderRadius: "40px 40px 0 0",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
