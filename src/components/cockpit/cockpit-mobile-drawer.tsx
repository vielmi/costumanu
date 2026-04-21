"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { NavItem } from "@/components/layout/sidebar";
import { BurgerIcon } from "@/lib/constants/icons";
import styles from "./cockpit-mobile-drawer.module.css";



interface CockpitMobileDrawerProps {
  navItems: NavItem[];
}

export function CockpitMobileDrawer({ navItems }: CockpitMobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function close() { setOpen(false); }

  async function handleLogout() {
    close();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.burgerButton}
        aria-label="Menü öffnen"
      >
        <BurgerIcon />
      </button>

      {open && (
        <div className={styles.overlay}>
          <button
            type="button"
            onClick={close}
            className={styles.closeButton}
            aria-label="Menü schliessen"
          >
            <Image src="/icons/icon-close-medium.svg" alt="" width={20} height={20} style={{ filter: "invert(1)" }} />
          </button>

          <div className={styles.content}>
            <p className={styles.sectionLabel}>Navigation</p>
            <nav>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={close} className={styles.navItem}>
                  <Image
                    src={`/icons/${item.icon}.svg`}
                    alt=""
                    width={22}
                    height={22}
                    style={{ filter: "invert(1)", flexShrink: 0 }}
                  />
                  <span className={styles.navLabel}>{item.label}</span>
                  <Image src="/icons/icon-arrow-s.svg" alt="" width={20} height={20} style={{ filter: "invert(1)" }} />
                </Link>
              ))}
            </nav>

            <div className={styles.divider} />

            <p className={styles.sectionLabel}>Kostüm erfassen</p>
            <nav>
              {[
                { label: "Kostüm erfassen",       href: "/kostueme/neu",               icon: "icon-shirt"     },
                { label: "Mehrteiler erfassen",    href: "/kostueme/neu?type=ensemble", icon: "icon-shirt-1"   },
                { label: "Kostüm Serie erfassen",  href: "/kostueme/neu?type=serie",    icon: "icon-serie"     },
              ].map((item) => (
                <Link key={item.href} href={item.href} onClick={close} className={styles.navItem}>
                  <Image
                    src={`/icons/${item.icon}.svg`}
                    alt=""
                    width={22}
                    height={22}
                    style={{ filter: "invert(1)", flexShrink: 0 }}
                  />
                  <span className={styles.navLabel}>{item.label}</span>
                  <Image src="/icons/icon-arrow-s.svg" alt="" width={20} height={20} style={{ filter: "invert(1)" }} />
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.profileFooter}>
            <div className={styles.avatarCircle}>
              <Image src="/icons/icon-avatar.svg" alt="" width={32} height={32} style={{ filter: "invert(1)" }} />
            </div>
            <Link href="/profile" onClick={close} className={styles.profileLabel}>
              Mein Profil
            </Link>
            <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
              Abmelden
            </button>
          </div>
        </div>
      )}
    </>
  );
}
