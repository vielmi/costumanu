import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShellClient } from "@/components/layout/app-shell-client";
import { resolveUserContext } from "@/lib/services/profile-service";
import { getPendingRentalsCount, getUnreadMessagesCount } from "@/lib/services/notification-service";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { userRole, theaterId } = await resolveUserContext(supabase, user.id);

  const [pendingRentals, unreadMessages] = await Promise.all([
    theaterId ? getPendingRentalsCount(supabase, theaterId, user.id) : Promise.resolve(0),
    getUnreadMessagesCount(supabase, user.id),
  ]);

  return (
    <AppShellClient
      userRole={userRole}
      unreadMessages={unreadMessages}
      pendingRentals={pendingRentals}
    >
      {children}
    </AppShellClient>
  );
}
