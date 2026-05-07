"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { NavItem } from "@/components/layout/sidebar";

const NAV_ITEMS: NavItem[] = [
  { label: "Home",         href: "/",                              icon: "icon-home-menu"       },
  { label: "Kostüme",      href: "/fundus",                        icon: "icon-shirt"           },
  { label: "Produktionen", href: "/produktionen",                  icon: "icon-production-menu", beta: true },
];

const ADMIN_NAV_ITEM: NavItem = {
  label: "Einstellungen", href: "/einstellungen/konfiguration", icon: "icon-setting",
};

function isAdmin(userRole: string): boolean {
  return userRole === "owner" || userRole === "admin" || userRole === "platform_admin";
}

interface Props {
  children: React.ReactNode;
  userRole: string;
  unreadMessages: number;
  pendingRentals: number;
  topBar?: React.ReactNode;
}

export function AppShellClient({ children, userRole, unreadMessages, pendingRentals, topBar }: Props) {
  const navItems = isAdmin(userRole) ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  const badges = { messages: unreadMessages, rentals: pendingRentals };
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--neutral-white)", overflow: "hidden" }}>
        <AppMobileHeader navItems={navItems} />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--page-bg)",
        overflow: "hidden",
        paddingTop: 20,
      }}
    >
      {/* ── Body: Sidebar + Content ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: "0 12px 12px 12px", gap: 12 }}>
        <Sidebar navItems={navItems} badges={badges} />

        {/* Right column — topBar in green area, white panel below */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {topBar ?? <div style={{ height: 72 }} />}
          <main style={{ flex: 1, overflowY: "auto", background: "var(--neutral-white)", borderRadius: "var(--radius-panel) var(--radius-panel) 0 0" }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
