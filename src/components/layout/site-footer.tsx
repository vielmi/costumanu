import { footerLinks } from "@/lib/constants/homepage-data";

export function SiteFooter() {
  return (
    <footer className="bg-surface-dark text-surface-dark-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 text-center">
          <span className="text-xl font-bold tracking-tight">kostüm+</span>
        </div>

        <nav className="mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-surface-dark-foreground/70 transition-colors hover:text-surface-dark-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-center text-xs text-surface-dark-foreground/50" suppressHydrationWarning>
          &copy; {new Date().getFullYear()} kostüm+. Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  );
}
