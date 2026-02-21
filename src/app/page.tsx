import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SearchBar } from "@/components/homepage/search-bar";
import { HeroText } from "@/components/homepage/hero-text";
import { GenderGrid } from "@/components/homepage/gender-grid";
import { ClothingTypeSection } from "@/components/homepage/clothing-type-section";
import { EventBanner } from "@/components/homepage/event-banner";
import { HorizontalCardRow } from "@/components/homepage/horizontal-card-row";
import { NetworkSection } from "@/components/homepage/network-section";
import { epochs, sparten, workUniforms } from "@/lib/constants/homepage-data";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main id="main-content">
        <SearchBar />
        <HeroText />
        <GenderGrid />
        <ClothingTypeSection />
        <EventBanner />

        <HorizontalCardRow
          title="Epochen"
          items={epochs.map((e) => ({
            label: e.label,
            image: e.image,
            subtitle: e.period,
          }))}
        />

        <HorizontalCardRow
          title="Sparte"
          items={sparten.map((s) => ({
            label: s.label,
            image: s.image,
          }))}
        />

        <HorizontalCardRow
          title="Arbeitsuniformen"
          items={workUniforms.map((u) => ({
            label: u.label,
            image: u.image,
          }))}
        />

        <NetworkSection />
      </main>

      <SiteFooter />
    </div>
  );
}
