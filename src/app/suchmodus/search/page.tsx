import { SuchmodusSearchClient } from "@/components/suchmodus/suchmodus-search-client";

type SearchParams = Promise<{ q?: string }>;

export default async function SuchmodusSearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialQuery = params.q ?? "";

  return <SuchmodusSearchClient initialQuery={initialQuery} />;
}
