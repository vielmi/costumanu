"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AppLogo } from "@/components/layout/app-logo";
import { CockpitMobileDrawer } from "@/components/cockpit/cockpit-mobile-drawer";
import type { NavItem } from "@/components/layout/sidebar";
import styles from "./app-mobile-header.module.css";

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Home",          href: "/",             icon: "icon-home-menu"       },
  { label: "Kostüme",       href: "/fundus",        icon: "icon-shirt"           },
  { label: "Aufführungen",  href: "/auffuehrungen", icon: "icon-production-menu" },
];

export function AppMobileHeader({
  navItems = DEFAULT_NAV_ITEMS,
  rightSlot,
}: {
  navItems?: NavItem[];
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <CockpitMobileDrawer navItems={navItems} />
        <AppLogo />
      </div>
      <div className={styles.right}>
        {rightSlot ?? (
          <Link href="/profile" className={styles.iconBtn} aria-label="Profil">
            <Image src="/icons/icon-user.svg" alt="" width={22} height={22} />
          </Link>
        )}
      </div>
    </header>
  );
}
