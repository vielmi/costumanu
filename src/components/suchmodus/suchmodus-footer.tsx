import Link from "next/link";
import Image from "next/image";
import styles from "./suchmodus-footer.module.css";

const FOOTER_LINKS = [
  { label: "Häufige Fragen",      href: "/support" },
  { label: "Ausleihe & Abholung", href: "/rental"  },
  { label: "Support & Kontakt",   href: "/support"  },
] as const;

export function SuchmodusFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.logo}>kostüm+</span>
      <nav className={styles.links}>
        {FOOTER_LINKS.map((link) => (
          <Link key={link.label} href={link.href} className={styles.link}>
            <span>{link.label}</span>
            <Image
              src="/icons/icon-arrow-s.svg"
              alt=""
              width={16}
              height={16}
              style={{ opacity: 0.7, filter: "invert(1)" }}
            />
          </Link>
        ))}
      </nav>
    </footer>
  );
}
