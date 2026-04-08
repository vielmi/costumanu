import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";

const footerNavLinks = [
  { label: "kostüm+ Website", href: "https://costumanu.com" },
  { label: t("footer.supportAndContact"), href: "/support" },
];

export function SiteFooter() {
  return (
    <footer className="bg-surface-dark text-surface-dark-foreground">
      <div style={{ padding: "28px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span className="text-xl font-bold tracking-tight">kostüm+</span>
          <nav style={{ display: "flex", gap: 24 }}>
            {footerNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 text-sm text-surface-dark-foreground/70 transition-colors hover:text-surface-dark-foreground"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-xs text-surface-dark-foreground/50">
          &copy; Kostüm+ |{" "}
          <Link href="/impressum" className="hover:text-surface-dark-foreground/70">
            {t("footer.imprint")}
          </Link>{" "}
          |{" "}
          <Link href="/datenschutz" className="hover:text-surface-dark-foreground/70">
            {t("footer.privacy")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
