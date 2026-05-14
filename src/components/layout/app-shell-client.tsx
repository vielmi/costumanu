"use client";

import Link from "next/link";
import Image from "next/image";
import { Sidebar } from "@/components/layout/sidebar";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { NavItem } from "@/components/layout/sidebar";

const BASE_NAV_ITEMS: NavItem[] = [{ label: "Home", href: "/", icon: "icon-home-menu" }];

const MEMBER_NAV_ITEMS: NavItem[] = [
  { label: "Kostüme", href: "/fundus", icon: "icon-shirt" },
  { label: "Produktionen", href: "/produktionen", icon: "icon-production-menu", beta: true },
];

const ADMIN_NAV_ITEM: NavItem = {
  label: "Einstellungen",
  href: "/einstellungen/konfiguration",
  icon: "icon-setting",
};

function isViewer(userRole: string): boolean {
  return userRole === "viewer";
}

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

function DefaultMobileActions({ viewer }: { viewer: boolean }) {
  if (viewer) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Link
        href="/fundus"
        aria-label="Suche"
        style={{
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
        }}
      >
        <Image src="/icons/icon-search.svg" alt="" width={22} height={22} />
      </Link>
      <Link
        href="/kostueme/neu"
        aria-label="Kostüm erfassen"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "var(--primary-900)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <Image
          src="/icons/icon-plus-m.svg"
          alt=""
          width={20}
          height={20}
          style={{ filter: "invert(1)" }}
        />
      </Link>
    </div>
  );
}

export function AppShellClient({
  children,
  userRole,
  unreadMessages,
  pendingRentals,
  topBar,
}: Props) {
  const viewer = isViewer(userRole);
  const memberItems = viewer ? [] : MEMBER_NAV_ITEMS;
  const navItems = isAdmin(userRole)
    ? [...BASE_NAV_ITEMS, ...memberItems, ADMIN_NAV_ITEM]
    : [...BASE_NAV_ITEMS, ...memberItems];
  const badges = { messages: unreadMessages, rentals: pendingRentals };
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--neutral-white)",
          overflow: "hidden",
        }}
      >
        <AppMobileHeader navItems={navItems} rightSlot={<DefaultMobileActions viewer={viewer} />} />
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
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
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          padding: "0 12px 12px 12px",
          gap: 12,
        }}
      >
        <Sidebar navItems={navItems} badges={badges} />

        {/* Right column — topBar in green area, white panel below */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {topBar ?? <div style={{ height: 72 }} />}
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              background: "var(--neutral-white)",
              borderRadius: "var(--radius-panel) var(--radius-panel) 0 0",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
