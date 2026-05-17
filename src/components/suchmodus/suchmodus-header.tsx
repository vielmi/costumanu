"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/layout/app-logo";
import { MobileMenuDrawer } from "@/components/suchmodus/mobile-menu-drawer";
import type { GenderTerm } from "@/components/suchmodus/suchmodus-cockpit";
import styles from "./suchmodus-header.module.css";

export function SuchmodusHeader({ genderTerms = [] }: { genderTerms?: GenderTerm[] }) {
  const pathname = usePathname();
  const logoHref = pathname === "/suchmodus" ? "/" : "/suchmodus";

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <MobileMenuDrawer genderTerms={genderTerms} />
        <AppLogo href={logoHref} />
      </div>
      <div className={styles.headerIcons}>
        <Link
          href="/kostueme/neu?camera=true"
          className={styles.headerIcon}
          aria-label="Kostüm erfassen"
        >
          <Image src="/icons/icon-camera.svg" alt="" width={24} height={24} />
        </Link>
        <Link href="/wishlist" className={styles.headerIcon} aria-label="Merkliste">
          <Image src="/icons/icon-heart.svg" alt="" width={24} height={24} />
        </Link>
      </div>
    </header>
  );
}
