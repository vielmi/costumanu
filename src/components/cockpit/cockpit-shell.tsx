"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CockpitContent } from "@/components/cockpit/cockpit-client";
import { AppLogo } from "@/components/layout/app-logo";

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
];

const ADMIN_NAV_ITEM: NavItem = { label: "Konfiguration", href: "/einstellungen/konfiguration", icon: "icon-setting", adminOnly: true };

const SIDEBAR_W = 209;
const SIDEBAR_COLLAPSED_W = 80;

export function CockpitShell({
  recentCostumes,
  theaterId,
  unreadMessages,
  pendingRentals,
  userRole,
}: CockpitShellProps) {
  const isAdmin = userRole === "owner" || userRole === "admin" || userRole === "platform_admin";
  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

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
        background: "var(--page-bg)",
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
          background: "var(--page-bg)",
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
            padding: collapsed ? "0 12px" : "0 12px 0 20px",
            gap: 8,
            transition: "width 200ms ease",
            overflow: "hidden",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <AppLogo showText={!collapsed} />
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Sidebar öffnen" : "Sidebar schliessen"}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--neutral-grey-600)",
              fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)", fontWeight: 700,
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
                background: "var(--neutral-white)", border: "1px solid var(--neutral-grey-200)",
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

          {/* Kostüm erfassen — primary with dropdown */}
          <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              style={{
                height: "var(--button-height-md)",
                padding: "0 30px",
                borderRadius: "16px",
                background: "var(--primary-900)",
                color: "var(--neutral-white)",
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
                  background: "var(--neutral-white)",
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
                  <button
                    key={item.href}
                    onClick={() => { setDropdownOpen(false); router.push(item.href); }}
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
          </div>

          {/* Profile footer */}
          <div ref={profileRef} style={{
            padding: "8px 8px 8px 12px", borderTop: "1px solid var(--neutral-grey-200)",
            flexShrink: 0, minHeight: 99, display: "flex", alignItems: "center",
            position: "relative",
          }}>
            <button onClick={() => setProfileOpen((o) => !o)} style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "0 8px",
              borderRadius: "var(--radius-sm)", background: "none", border: "none",
              cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start",
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
                    flex: 1, whiteSpace: "nowrap", textAlign: "left",
                  }}>
                    Mein Profil
                  </span>
                  <Image src="/icons/icon-arrow-dropdown-down.svg" alt="" width={16} height={16}
                    style={{ flexShrink: 0, transform: profileOpen ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}
                  />
                </>
              )}
            </button>

            {profileOpen && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 4px)", left: 12, right: 8,
                background: "var(--neutral-white)", border: "1px solid var(--neutral-grey-200)",
                borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-300)",
                overflow: "hidden", zIndex: 200,
              }}>
                <Link href="/profile" onClick={() => setProfileOpen(false)} style={{
                  display: "flex", alignItems: "center", height: 48, padding: "0 16px",
                  textDecoration: "none", fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-500)",
                  color: "var(--neutral-grey-700)", borderBottom: "1px solid var(--neutral-grey-100)",
                }}>
                  Mein Profil
                </Link>
                <button onClick={handleLogout} style={{
                  display: "flex", alignItems: "center", width: "100%", height: 48, padding: "0 16px",
                  background: "none", border: "none", cursor: "pointer", textAlign: "left",
                  fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
                  fontWeight: "var(--font-weight-500)", color: "var(--color-error)",
                }}>
                  Abmelden
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main scrollable content — white rounded card */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: "var(--neutral-white)",
            borderRadius: "40px 40px 0 0",
          }}
        >
          <CockpitContent recentCostumes={recentCostumes} theaterId={theaterId} />
        </main>
      </div>
    </div>
  );
}
