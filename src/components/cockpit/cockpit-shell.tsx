"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CockpitContent } from "@/components/cockpit/cockpit-client";

interface Provenance {
  production_title: string;
  year: number | null;
}

interface GenderTerm { id: string; label_de: string; }
interface ClothingType { id: string; label_de: string; }
interface CostumeMedia { storage_path: string; sort_order: number; }
interface CostumeItem { current_status: string; }

export interface RecentCostume {
  id: string;
  name: string;
  created_at: string;
  gender_term: GenderTerm | null;
  clothing_type: ClothingType | null;
  costume_media: CostumeMedia[];
  costume_items: CostumeItem[];
  costume_provenance: Provenance[];
}

interface CockpitShellProps {
  recentCostumes: RecentCostume[];
  theaterId: string | null;
  unreadMessages: number;
  pendingRentals: number;
  userRole: string;
}

type NavItem = { label: string; href: string; icon: string; badgeKey?: string; adminOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: "Home",          href: "/",              icon: "icon-home-menu"       },
  { label: "Kostüme",       href: "/fundus",         icon: "icon-shirt"           },
  { label: "Aufführungen",  href: "/auffuehrungen",  icon: "icon-production-menu" },
  { label: "Darsteller",    href: "/darsteller",     icon: "icon-artist-menu"     },
  { label: "Termine",       href: "/termine",        icon: "icon-calendar-menu"   },
  { label: "Kontakte",      href: "/kontakte",       icon: "icon-contact-book"    },
  { label: "Nachrichten",   href: "/messages",       icon: "icon-chat",    badgeKey: "messages" },
  { label: "Ausleihen",     href: "/rental",         icon: "icon-shopping-bag", badgeKey: "rentals" },
];

const ADMIN_NAV_ITEM: NavItem = { label: "Konfiguration", href: "/einstellungen/konfiguration", icon: "icon-setting", adminOnly: true };

const SIDEBAR_W = 209;
const SIDEBAR_COLLAPSED_W = 64;

export function CockpitShell({
  recentCostumes,
  theaterId,
  unreadMessages,
  pendingRentals,
  userRole,
}: CockpitShellProps) {
  const isAdmin = userRole === "owner" || userRole === "admin";
  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || !theaterId) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("costumes")
      .select("id, name")
      .eq("theater_id", theaterId)
      .ilike("name", `%${q}%`)
      .limit(8);
    setSearchResults(data ?? []);
  }, [supabase, theaterId]);

  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery, runSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  function getBadge(key?: string) {
    if (key === "messages") return unreadMessages;
    if (key === "rentals") return pendingRentals;
    return 0;
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--secondary-500)",
        overflow: "hidden",
        paddingTop: 20,
      }}
    >
      {/* ═══════════════════════════════════════════
          Full-width top bar
          ═══════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          background: "var(--secondary-500)",
          height: 72,
        }}
      >
        {/* Logo section — same width as sidebar */}
        <div
          style={{
            width: sidebarW,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            padding: "0 12px 0 20px",
            gap: 8,
            transition: "width 200ms ease",
            overflow: "hidden",
          }}
        >
          <div style={{
            width: 38, height: 38,
            background: "#0D0D0D",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "var(--font-family-base)",
              fontWeight: "var(--font-weight-700)",
              fontSize: 18,
              color: "#F5C842",
              lineHeight: 1,
            }}>K</span>
          </div>
          {!collapsed && (
            <span style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-350)",
              fontWeight: "var(--font-weight-700)",
              color: "var(--neutral-grey-700)",
              whiteSpace: "nowrap",
              flex: 1,
            }}>kostüm+</span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Sidebar öffnen" : "Sidebar schliessen"}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--neutral-grey-600)",
              fontFamily: "var(--font-family-base)", fontSize: 16, fontWeight: 700,
              flexShrink: 0, opacity: 0.2,
            }}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {/* Search + action buttons */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 36px 0 24px",
            justifyContent: "space-between",
          }}
        >
          {/* Search pill — live */}
          <div ref={searchRef} style={{ flex: 1, maxWidth: 640, position: "relative" }}>
            <div style={{
              height: 52, borderRadius: 47,
              background: "var(--secondary-500)",
              border: "1px solid var(--neutral-black)",
              display: "flex", alignItems: "center", gap: 10, padding: "0 16px",
            }}>
              <Image src="/icons/icon-search.svg" alt="" width={20} height={20} style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Kostüme suchen"
                style={{
                  flex: 1, border: "none", background: "transparent",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  fontWeight: "var(--font-weight-400)",
                  color: "var(--neutral-grey-700)",
                  letterSpacing: "0.002em",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", opacity: 0.5 }}>
                  <Image src="/icons/icon-close-medium.svg" alt="" width={16} height={16} />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {searchOpen && searchQuery.trim() && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "#FFFFFF", border: "1px solid var(--neutral-grey-200)",
                borderRadius: 16, boxShadow: "var(--shadow-300)", zIndex: 200, overflow: "hidden",
              }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: "14px 20px", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-400)" }}>
                    Keine Kostüme gefunden
                  </div>
                ) : (
                  searchResults.map((c) => (
                    <button key={c.id} type="button"
                      onClick={() => { router.push(`/costume/${c.id}`); setSearchOpen(false); setSearchQuery(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        width: "100%", height: 52, padding: "0 20px",
                        background: "none", border: "none", borderBottom: "1px solid var(--neutral-grey-100)",
                        cursor: "pointer", textAlign: "left",
                      }}>
                      <Image src="/icons/icon-shirt.svg" alt="" width={16} height={16} style={{ opacity: 0.4, flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-700)" }}>
                        {c.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Buttons group — right-aligned */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>

          {/* Ausleihe erfassen — secondary */}
          <Link
            href="/rental/new"
            style={{
              height: 57,
              padding: "0 30px",
              borderRadius: "16px",
              border: "1px solid var(--primary-900)",
              color: "var(--primary-900)",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-350)",
              fontWeight: "var(--font-weight-500)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Ausleihe erfassen
          </Link>

          {/* Kostüm erfassen — primary with dropdown */}
          <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              style={{
                height: 57,
                padding: "0 30px",
                borderRadius: "16px",
                background: "var(--primary-900)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-350)",
                fontWeight: "var(--font-weight-500)",
                whiteSpace: "nowrap",
                border: "none",
                cursor: "pointer",
              }}
            >
              Kostüm erfassen
              <Image
                src="/icons/icon-arrow-dropdown-down.svg"
                alt=""
                width={16}
                height={16}
                style={{
                  filter: "invert(1)",
                  transform: dropdownOpen ? "rotate(180deg)" : "none",
                  transition: "transform 150ms ease",
                }}
              />
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "#FFFFFF",
                  border: "1px solid var(--neutral-grey-300)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-300)",
                  minWidth: 220,
                  zIndex: 100,
                  overflow: "hidden",
                }}
              >
                {[
                  { label: "Etikett scannen",      href: "/kostueme/scan",              icon: "icon-barcode-scan" },
                  { label: "Kostüm erfassen",       href: "/kostueme/neu",               icon: "icon-shirt"        },
                  { label: "Mehrteiler erfassen",   href: "/kostueme/neu?type=ensemble", icon: "icon-shirt-1"      },
                  { label: "Kostüm Serie erfassen", href: "/kostueme/neu?type=serie",    icon: "icon-serie"        },
                ].map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      height: 48,
                      padding: "0 16px",
                      textDecoration: "none",
                      borderTop: i > 0 ? "1px solid var(--neutral-grey-200)" : "none",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "var(--font-size-200)",
                      fontWeight: "var(--font-weight-500)",
                      color: "var(--neutral-grey-700)",
                    }}
                  >
                    <Image src={`/icons/${item.icon}.svg`} alt="" width={18} height={18} />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          </div>{/* end buttons group */}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Body: sidebar nav + main content
          ═══════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: "20px 12px 12px", gap: 12 }}>

        {/* Sidebar nav */}
        <nav
          style={{
            width: sidebarW,
            flexShrink: 0,
            background: "transparent",
            display: "flex",
            flexDirection: "column",
            transition: "width 200ms ease",
          }}
        >
          {/* Nav items */}
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
                    display: "flex",
                    alignItems: "center",
                    width: collapsed ? undefined : 166,
                    height: 50,
                    padding: "0 12px",
                    gap: 10,
                    borderRadius: 8,
                    background: isActive ? "#D6DFDD" : "transparent",
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
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#FFFFFF",
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
          </div>

          {/* Profile footer */}
          <div
            style={{
              padding: "8px 8px 8px 12px",
              borderTop: "1px solid var(--neutral-grey-200)",
              flexShrink: 0,
              minHeight: 99,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Link
              href="/profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "0 8px",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
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
                    }}
                  >
                    Mein Profil
                  </span>
                  <Image
                    src="/icons/icon-arrow-dropdown-down.svg"
                    alt=""
                    width={16}
                    height={16}
                    style={{ flexShrink: 0 }}
                  />
                </>
              )}
            </Link>
          </div>
        </nav>

        {/* Main scrollable content — white rounded card */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#FFFFFF",
            borderRadius: "40px 40px 0 0",
          }}
        >
          <CockpitContent recentCostumes={recentCostumes} theaterId={theaterId} />
        </main>
      </div>
    </div>
  );
}
