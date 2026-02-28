import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThreadList } from "@/components/messages/thread-list";
import { t } from "@/lib/i18n";

export default async function NachrichtenPage() {
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch chat threads the user participates in,
  // including participants and the latest message per thread.
  const { data: threads } = await supabase
    .from("chat_thread_participants")
    .select(
      `
      thread_id,
      chat_threads (
        id,
        title,
        updated_at,
        chat_thread_participants (
          user_id,
          profiles (
            display_name,
            avatar_url
          )
        ),
        chat_messages (
          id,
          body,
          created_at,
          sender_id,
          is_read
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("updated_at", {
      referencedTable: "chat_threads",
      ascending: false,
    });

  // Normalize the joined data into a flat list of threads
  const normalizedThreads = (threads ?? []).map((row) => {
    const thread = row.chat_threads as unknown as {
      id: string;
      title: string | null;
      updated_at: string;
      chat_thread_participants: {
        user_id: string;
        profiles: {
          display_name: string | null;
          avatar_url: string | null;
        } | null;
      }[];
      chat_messages: {
        id: string;
        body: string;
        created_at: string;
        sender_id: string;
        is_read: boolean;
      }[];
    };

    // Get the latest message (Supabase returns them in default order)
    const latestMessage = thread.chat_messages?.[0] ?? null;

    // Count unread messages from other users
    const unreadCount = (thread.chat_messages ?? []).filter(
      (msg) => !msg.is_read && msg.sender_id !== user.id
    ).length;

    // Get the other participants (exclude current user)
    const otherParticipants = (thread.chat_thread_participants ?? [])
      .filter((p) => p.user_id !== user.id)
      .map((p) => ({
        userId: p.user_id,
        displayName: p.profiles?.display_name ?? t("messages.unknown"),
        avatarUrl: p.profiles?.avatar_url ?? null,
      }));

    // Thread display name: use title if set, otherwise the other participant names
    const displayName =
      thread.title ??
      otherParticipants.map((p) => p.displayName).join(", ") ??
      t("messages.conversation");

    return {
      id: thread.id,
      displayName,
      avatarUrl: otherParticipants[0]?.avatarUrl ?? null,
      lastMessage: latestMessage?.body ?? null,
      lastMessageAt: latestMessage?.created_at ?? thread.updated_at,
      unreadCount,
    };
  });

  // Sort by most recent message
  normalizedThreads.sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() -
      new Date(a.lastMessageAt).getTime()
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{t("messages.title")}</h1>

        <ThreadList
          initialThreads={normalizedThreads}
          userId={user.id}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
