import { createClient } from "@/lib/supabase/server";
import { SuchmodusCockpit, type NetworkTheater } from "@/components/suchmodus/suchmodus-cockpit";

export default async function SuchmodusPage() {
  const supabase = await createClient();

  const [{ data: networkData }, { data: allData }] = await Promise.all([
    supabase
      .from("theaters")
      .select("id, name, slug, settings")
      .eq("settings->>show_in_network", "true")
      .order("name"),
    supabase
      .from("theaters")
      .select("id, name, slug, settings")
      .order("name"),
  ]);

  return (
    <SuchmodusCockpit
      networkTheaters={(networkData ?? []) as NetworkTheater[]}
      theaters={(allData ?? []) as NetworkTheater[]}
    />
  );
}
