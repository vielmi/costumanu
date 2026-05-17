import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CockpitShell } from "@/components/cockpit/cockpit-shell";
import { resolveUserContext } from "@/lib/services/profile-service";
import { getRecentCostumes } from "@/lib/services/costume-service";
import {
  getPendingRentalsCount,
  getUnreadMessagesCount,
} from "@/lib/services/notification-service";

export const metadata: Metadata = { title: "Cockpit" };

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { userRole, theaterId } = await resolveUserContext(supabase, user.id);

  // Viewers (internal role "viewer" or no theater assignment) land on Suchmodus.
  if (userRole === "viewer") {
    redirect("/suchmodus");
  }

  const [recentCostumes, pendingRentals, unreadMessages] = await Promise.all([
    theaterId ? getRecentCostumes(supabase, theaterId) : Promise.resolve([]),
    theaterId ? getPendingRentalsCount(supabase, theaterId, user.id) : Promise.resolve(0),
    getUnreadMessagesCount(supabase, user.id),
  ]);

  return (
    <CockpitShell
      recentCostumes={recentCostumes}
      theaterId={theaterId}
      unreadMessages={unreadMessages}
      pendingRentals={pendingRentals}
      userRole={userRole}
    />
  );
}
