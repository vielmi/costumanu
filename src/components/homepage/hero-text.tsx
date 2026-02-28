import { t } from "@/lib/i18n";

export function HeroText() {
  return (
    <section className="px-4 pb-6 text-center">
      <h1 className="mx-auto max-w-lg text-2xl font-bold leading-tight tracking-tight md:text-3xl">
        {t("home.heroTitle")}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {t("home.heroSubtitle")}
      </p>
    </section>
  );
}
