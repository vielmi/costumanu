import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SearchOverlay } from "@/components/search/search-overlay";

type SearchParams = Promise<{
  q?: string;
}>;

export default async function SuchePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialQuery = params.q ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <SearchOverlay initialQuery={initialQuery} />
      </main>
      <SiteFooter />
    </div>
  );
}
