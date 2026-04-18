"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLogo } from "@/components/layout/app-logo";
import { SIDEBAR } from "@/lib/constants/layout";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badgeKey?: string;
};

interface SidebarProps {
  navItems: NavItem[];
  badges: Record<string, number>;
  /** Gibt den aktuellen Breitenwert zurück, damit das Parent-Layout reagieren kann */
  onWidthChange?: (width: number) => void;
}

/**
 * Gemeinsame Sidebar für AppShell und CockpitShell.
 * Enthält: Nav-Links, Collapse/Expand, Profile-Footer mit Logout.
 */
export function Sidebar({ navItems, badges, onWidthChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const width = collapsed ? SIDEBAR.COLLAPSED_WIDTH : SIDEBAR.EXPANDED_WIDTH;

  useEffect(() => {
    onWidthChange?.(width);
  }, [width, onWidthChange]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isNavItemActive(href: string): boolean {
    if (pathname === href) return true;
    // Kostüme-Sektion ist aktiv bei Kostüm-Subseiten
    if (href === "/fundus" && (pathname.startsWith("/costume/") || pathname.startsWith("/kostueme/"))) return true;
    return false;
  }

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        transition: "width 200ms ease",
      }}
    >
      {/* Logo + Collapse-Button */}
      <div
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 12px" : "0 12px 0 20px",
          gap: 8,
          overflow: "hidden",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <AppLogo showText={!collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Sidebar öffnen" : "Sidebar schliessen"}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--neutral-grey-600)",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-300)",
            fontWeight: 700,
            flexShrink: 0,
            opacity: 0.3,
          }}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* Nav-Links */}
      <nav style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
        {navItems.map((item, index) => {
          const isActive = isNavItemActive(item.href);
          const badge = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                width: collapsed ? undefined : 166,
                height: 50,
                padding: "0 12px",
                gap: 10,
                borderRadius: 8,
                background: isActive ? "var(--secondary-550)" : "transparent",
                textDecoration: "none",
                borderBottom: index < navItems.length - 1 ? "1px solid var(--secondary-500)" : "none",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <Image
                src={`/icons/${item.icon}.svg`}
                alt={item.label}
                width={20}
                height={20}
                style={{ flexShrink: 0 }}
              />
              {!collapsed && (
                <>
                  <span
                    style={{
                      fontFamily: "var(--font-family-base)",
                      fontSize: "var(--font-size-200)",
                      fontWeight: "var(--font-weight-500)",
                      color: "var(--neutral-grey-600)",
                      flex: 1,
                      whiteSpace: "nowrap",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {item.label}
                  </span>
                  {badge > 0 && (
                    <span
                      style={{
                        minWidth: 22,
                        height: 22,
                        background: "var(--neutral-grey-600)",
                        borderRadius: 103,
                        fontSize: "var(--font-size-50)",
                        fontWeight: 700,
                        color: "var(--neutral-white)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 5px",
                        flexShrink: 0,
                        fontFamily: "var(--font-family-base)",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile-Footer */}
      <div
        ref={profileRef}
        style={{
          padding: "8px 8px 8px 12px",
          borderTop: "1px solid var(--neutral-grey-200)",
          flexShrink: 0,
          minHeight: 99,
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        <button
          onClick={() => setProfileOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "0 8px",
            borderRadius: "var(--radius-sm)",
            background: "none",
            border: "none",
            cursor: "pointer",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "var(--secondary-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <Image
              src="/icons/icon-avatar.svg"
              alt=""
              width={28}
              height={28}
              style={{ filter: "invert(1)" }}
            />
          </div>
          {!collapsed && (
            <>
              <span
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  fontWeight: "var(--font-weight-700)",
                  color: "var(--neutral-grey-600)",
                  flex: 1,
                  whiteSpace: "nowrap",
                  textAlign: "left",
                }}
              >
                Mein Profil
              </span>
              <Image
                src="/icons/icon-arrow-dropdown-down.svg"
                alt=""
                width={16}
                height={16}
                style={{
                  flexShrink: 0,
                  transform: profileOpen ? "rotate(180deg)" : "none",
                  transition: "transform 150ms ease",
                }}
              />
            </>
          )}
        </button>

        {profileOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: 12,
              right: 8,
              background: "#FFFFFF",
              border: "1px solid var(--neutral-grey-200)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-300)",
              overflow: "hidden",
              zIndex: 200,
            }}
          >
            <Link
              href="/profile"
              onClick={() => setProfileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                height: 48,
                padding: "0 16px",
                textDecoration: "none",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-200)",
                fontWeight: "var(--font-weight-500)",
                color: "var(--neutral-grey-700)",
                borderBottom: "1px solid var(--neutral-grey-100)",
              }}
            >
              Mein Profil
            </Link>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                height: 48,
                padding: "0 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-200)",
                fontWeight: "var(--font-weight-500)",
                color: "var(--color-error)",
              }}
            >
              Abmelden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
