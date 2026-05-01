"use client";

import { Sidebar } from "@/components/layout/sidebar";
import type { NavItem } from "@/components/layout/sidebar";

const NAV_ITEMS: NavItem[] = [
  { label: "Home",         href: "/",                              icon: "icon-home-menu"       },
  { label: "Kostüme",      href: "/fundus",                        icon: "icon-shirt"           },
  { label: "Aufführungen", href: "/auffuehrungen",                 icon: "icon-production-menu" },
];

const ADMIN_NAV_ITEM: NavItem = {
  label: "Konfiguration", href: "/einstellungen/konfiguration", icon: "icon-setting",
};

function isAdmin(userRole: string): boolean {
  return userRole === "owner" || userRole === "admin" || userRole === "platform_admin";
}

interface Props {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  userRole: string;
  unreadMessages: number;
  pendingRentals: number;
}

export function AppShellClient({ children, topBar, userRole, unreadMessages, pendingRentals }: Props) {
  const navItems = isAdmin(userRole) ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  const badges = { messages: unreadMessages, rentals: pendingRentals };

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

        {/* Right column: optional top bar + white content area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {topBar}
          <div style={{
            flex: 1,
            borderRadius: "var(--radius-panel) var(--radius-panel) 0 0",
            overflow: "hidden",
            marginTop: topBar ? 0 : 20,
          }}>
            <main style={{ height: "100%", overflowY: "auto", background: "var(--neutral-white)" }}>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
