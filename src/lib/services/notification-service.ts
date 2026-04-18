/**
 * notification-service.ts
 *
 * Badge-Counts für Rental-Anfragen und ungelesene Nachrichten.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPendingRentalsCount(
  supabase: SupabaseClient,
  theaterId: string,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("rental_orders")
    .select("id", { count: "exact", head: true })
    .eq("lender_theater_id", theaterId)
    .eq("status", "requested")
    .neq("borrower_user_id", userId);

  return count ?? 0;
}

export async function getUnreadMessagesCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: participations } = await supabase
    .from("chat_thread_participants")
    .select("thread_id, last_read_at")
    .eq("user_id", userId);

  if (!participations?.length) return 0;

  const results = await Promise.all(
    participations.map((p) =>
      supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("thread_id", p.thread_id)
        .neq("sender_id", userId)
        .gt("created_at", p.last_read_at ?? "1970-01-01T00:00:00Z")
    )
  );

  return results.reduce((sum, r) => sum + (r.count ?? 0), 0);
}
