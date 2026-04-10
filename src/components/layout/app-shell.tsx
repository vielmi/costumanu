import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShellClient } from "@/components/layout/app-shell-client";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("theater_members")
    .select("theater_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const userRole  = membership?.role ?? "member";
  const theaterId = membership?.theater_id ?? null;

  const { count: pendingRentals } = theaterId
    ? await supabase
        .from("rental_orders")
        .select("id", { count: "exact", head: true })
        .eq("lender_theater_id", theaterId)
        .eq("status", "requested")
        .neq("borrower_user_id", user.id)
    : { count: 0 };

  const { data: participations } = await supabase
    .from("chat_thread_participants")
    .select("thread_id, last_read_at")
    .eq("user_id", user.id);

  let unreadMessages = 0;
  if (participations?.length) {
    const results = await Promise.all(
      participations.map((p) =>
        supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("thread_id", p.thread_id)
          .neq("sender_id", user.id)
          .gt("created_at", p.last_read_at ?? "1970-01-01T00:00:00Z")
      )
    );
    unreadMessages = results.reduce((sum, r) => sum + (r.count ?? 0), 0);
  }

  return (
    <AppShellClient
      userRole={userRole}
      unreadMessages={unreadMessages}
      pendingRentals={pendingRentals ?? 0}
    >
      {children}
    </AppShellClient>
  );
}
