import { createClient } from "@/lib/supabase/server";
import { SuchmodusCockpit, type NetworkTheater } from "@/components/suchmodus/suchmodus-cockpit";

export default async function SuchmodusPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("theaters")
    .select("id, name, slug, settings")
    .eq("settings->>show_in_network", "true")
    .order("name");

  const networkTheaters = (data ?? []) as NetworkTheater[];

  return <SuchmodusCockpit networkTheaters={networkTheaters} />;
}
