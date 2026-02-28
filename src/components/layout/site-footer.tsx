import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";

const footerNavLinks = [
  { labelKey: "footer.faq" as const, href: "/faq" },
  { labelKey: "footer.rentalAndPickup" as const, href: "/rental" },
  { labelKey: "footer.supportAndContact" as const, href: "/support" },
];

export function SiteFooter() {
  return (
    <footer className="bg-surface-dark text-surface-dark-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <span className="text-xl font-bold tracking-tight">kostüm+</span>
        </div>

        <nav className="mb-8 flex flex-col gap-3">
          {footerNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-sm text-surface-dark-foreground/70 transition-colors hover:text-surface-dark-foreground"
            >
              {t(link.labelKey)}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </nav>

        <p className="text-xs text-surface-dark-foreground/50">
          &copy; Kostüm+ |{" "}
          <Link
            href="/impressum"
            className="hover:text-surface-dark-foreground/70"
          >
            {t("footer.imprint")}
          </Link>{" "}
          |{" "}
          <Link
            href="/datenschutz"
            className="hover:text-surface-dark-foreground/70"
          >
            {t("footer.privacy")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
