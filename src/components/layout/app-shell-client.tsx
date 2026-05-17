"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { NavItem } from "@/components/layout/sidebar";

const ERFASSEN_ITEMS = [
  { label: "Etikett scannen", href: "/kostueme/scan", icon: "icon-barcode-scan" },
  { label: "Kostüm erfassen", href: "/kostueme/neu", icon: "icon-shirt" },
] as const;

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
  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setAddOpen(false);
      }
    }
    if (addOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [addOpen]);

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
      <div ref={addRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          aria-label="Kostüm erfassen"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--primary-900)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
          }}
        >
          <Image
            src="/icons/icon-plus-m.svg"
            alt=""
            width={20}
            height={20}
            style={{ filter: "invert(1)" }}
          />
        </button>
        {addOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "var(--neutral-white)",
              border: "1px solid var(--neutral-grey-300)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-300)",
              minWidth: 200,
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            {ERFASSEN_ITEMS.map((item, i) => (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  setAddOpen(false);
                  router.push(item.href);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  height: 48,
                  padding: "0 16px",
                  borderTop: i > 0 ? "1px solid var(--neutral-grey-200)" : "none",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  fontWeight: "var(--font-weight-500)",
                  color: "var(--neutral-grey-700)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <Image src={`/icons/${item.icon}.svg`} alt="" width={18} height={18} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
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
