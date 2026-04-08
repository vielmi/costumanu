"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Home",          href: "/",               icon: "icon-home-menu"       },
  { label: "Kostüme",       href: "/fundus",          icon: "icon-shirt"           },
  { label: "Aufführungen",  href: "/auffuehrungen",   icon: "icon-production-menu" },
  { label: "Darsteller",    href: "/darsteller",      icon: "icon-artist-menu"     },
  { label: "Termine",       href: "/termine",         icon: "icon-calendar-menu"   },
  { label: "Kontakte",      href: "/kontakte",        icon: "icon-contact-book"    },
  { label: "Einstellungen", href: "/einstellungen",   icon: "icon-setting"         },
  { label: "Nachrichten",   href: "/messages",        icon: "icon-chat",     badge: 22 },
  { label: "Ausleihen",     href: "/rental",          icon: "icon-shopping-bag", badge: 3 },
];

export function CockpitSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 56 : 209,
        minHeight: "100vh",
        background: "var(--secondary-500)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 200ms ease",
        overflow: "hidden",
        borderRight: "1px solid var(--neutral-grey-300)",
      }}
    >
      {/* ─── Logo + Collapse ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: "20px 12px 16px",
          flexShrink: 0,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Link
            href="/cockpit"
            style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-350)",
              fontWeight: "var(--font-weight-700)",
              color: "var(--neutral-grey-700)",
              textDecoration: "none",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            kostüm+
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            width: 32,
            height: 32,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-xs)",
            flexShrink: 0,
          }}
          aria-label={collapsed ? "Sidebar öffnen" : "Sidebar schliessen"}
        >
          <Image
            src="/icons/icon-chevron-left.svg"
            alt=""
            width={20}
            height={20}
            style={{
              transform: collapsed ? "rotate(180deg)" : "none",
              transition: "transform 200ms ease",
            }}
          />
        </button>
      </div>

      {/* ─── Nav Items ─── */}
      <nav style={{ flex: 1, padding: "0 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                height: 50,
                padding: "0 8px",
                gap: 8,
                borderRadius: "var(--radius-sm)",
                background: isActive ? "#D6DFDD" : "transparent",
                textDecoration: "none",
                borderTop: index > 0 ? "1px solid var(--neutral-grey-400)" : "none",
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
                    }}
                  >
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
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
                        padding: "0 4px",
                        flexShrink: 0,
                        fontFamily: "var(--font-family-base)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ─── Profile ─── */}
      <div
        style={{
          padding: "8px",
          borderTop: "1px solid var(--neutral-grey-300)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 50,
            padding: "0 8px",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--secondary-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Image
              src="/icons/icon-avatar.svg"
              alt=""
              width={18}
              height={18}
              style={{ filter: "invert(1)" }}
            />
          </div>
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
    </aside>
  );
}
