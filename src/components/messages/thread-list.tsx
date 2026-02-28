"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MessageCircle } from "lucide-react";
import { t } from "@/lib/i18n";

interface ChatThread {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

interface ThreadListProps {
  initialThreads: ChatThread[];
  userId: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return t("messages.now");
  if (diffMinutes < 60) return t("messages.minutesAgo", { n: diffMinutes });
  if (diffHours < 24) return t("messages.hoursAgo", { n: diffHours });
  if (diffDays < 7) return t("messages.daysAgo", { n: diffDays });

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ThreadList({ initialThreads, userId }: ThreadListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const { data: threads } = useQuery({
    queryKey: ["chat-threads"],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq("user_id", userId);

      if (error) throw error;

      return (data ?? [])
        .map((row) => {
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

          const latestMessage = thread.chat_messages?.[0] ?? null;
          const unreadCount = (thread.chat_messages ?? []).filter(
            (msg) => !msg.is_read && msg.sender_id !== userId
          ).length;

          const otherParticipants = (thread.chat_thread_participants ?? [])
            .filter((p) => p.user_id !== userId)
            .map((p) => ({
              displayName: p.profiles?.display_name ?? t("messages.unknown"),
              avatarUrl: p.profiles?.avatar_url ?? null,
            }));

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
          } satisfies ChatThread;
        })
        .sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        );
    },
    initialData: initialThreads,
    refetchInterval: 30_000, // Poll every 30 seconds for new messages
  });

  // Filter threads by search query
  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.displayName.toLowerCase().includes(query) ||
      (thread.lastMessage?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("messages.searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {/* Thread list */}
      {filteredThreads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MessageCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">
              {t("messages.noMessages")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              {t("messages.noMessagesDescription")}
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-16rem)]">
          <div className="flex flex-col gap-2">
            {filteredThreads.map((thread) => (
              <Card
                key={thread.id}
                className="cursor-pointer py-3 transition-colors hover:bg-accent/50"
              >
                <CardContent className="flex items-center gap-3">
                  {/* Avatar */}
                  {thread.avatarUrl ? (
                    <img
                      src={thread.avatarUrl}
                      alt={thread.displayName}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                      {getInitials(thread.displayName)}
                    </div>
                  )}

                  {/* Thread content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          thread.unreadCount > 0
                            ? "font-semibold"
                            : "font-medium"
                        }`}
                      >
                        {thread.displayName}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(thread.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-muted-foreground">
                        {thread.lastMessage ?? ""}
                      </p>
                      {thread.unreadCount > 0 && (
                        <Badge className="shrink-0 text-[10px]">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
