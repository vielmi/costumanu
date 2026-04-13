"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  author_name: string;
  author_initials: string;
  replies?: Comment[];
}

interface Member {
  user_id: string;
  display_name: string;
}

interface Props {
  costumeId: string;
  theaterId: string;
  currentUserId: string;
  currentUserName: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function getInitials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function parseMentions(body: string) {
  // Render @Name as highlighted tag
  const parts = body.split(/(@\w[\w\s]*)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} style={{
        background: "#DFEFF7", borderRadius: 4,
        padding: "1px 5px", marginRight: 2,
        fontFamily: "var(--font-family-base)", fontSize: "inherit",
      }}>{part}</span>
    ) : part
  );
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--secondary-500)",
      border: `3px solid var(--secondary-500)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-family-base)", fontSize: size * 0.35, fontWeight: 700,
      color: "var(--secondary-800)",
    }}>
      {getInitials(name)}
    </div>
  );
}

function CommentBubble({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: (parentId: string, mentionName: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        border: "1px solid var(--neutral-grey-300)",
        borderRadius: "16px 16px 16px 0px",
        background: "var(--neutral-white)",
        padding: "14px 18px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={comment.author_name} size={38} />
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: 700, color: "var(--neutral-grey-600)" }}>
              {comment.author_name}
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-100)", color: "var(--neutral-grey-400)" }}>
            {formatDate(comment.created_at)}
          </span>
        </div>

        {/* Body */}
        <p style={{
          fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-250)",
          color: "var(--neutral-grey-600)", lineHeight: 1.55, margin: 0,
        }}>
          {parseMentions(comment.body)}
        </p>

        {/* Antworten */}
        <button
          type="button"
          onClick={() => onReply(comment.id, comment.author_name)}
          style={{
            alignSelf: "flex-end", background: "none", border: "none",
            cursor: "pointer", fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-150)", color: "var(--secondary-700)", fontWeight: 500,
            padding: 0,
          }}
        >
          Antworten
        </button>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ paddingLeft: 32, display: "flex", flexDirection: "column", gap: 8 }}>
          {comment.replies.map(reply => (
            <div key={reply.id} style={{
              border: "1px solid var(--neutral-grey-200)",
              borderRadius: "12px 12px 12px 0px",
              background: "var(--secondary-500)",
              padding: "12px 16px",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={reply.author_name} size={28} />
                <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", fontWeight: 700, color: "var(--neutral-grey-600)" }}>
                  {reply.author_name}
                </span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-75)", color: "var(--neutral-grey-400)" }}>
                  {formatDate(reply.created_at)}
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-600)", lineHeight: 1.5, margin: 0 }}>
                {parseMentions(reply.body)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CostumeComments({ costumeId, theaterId, currentUserId, currentUserName }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ parentId: string; mentionName: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<Member[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function loadComments() {
    const supabase = createClient();
    const { data } = await supabase
      .from("costume_comments")
      .select("id, body, created_at, parent_id, user_id, profiles(display_name)")
      .eq("costume_id", costumeId)
      .order("created_at", { ascending: true });

    if (!data) return;

    const flat: Comment[] = data.map((c: Record<string, unknown> & { profiles?: { display_name?: string } }) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      parent_id: c.parent_id,
      user_id: c.user_id,
      author_name: c.profiles?.display_name ?? "Unbekannt",
      author_initials: getInitials(c.profiles?.display_name ?? "?"),
    }));

    // Nest replies under parents
    const roots: Comment[] = [];
    const map: Record<string, Comment> = {};
    flat.forEach(c => { map[c.id] = { ...c, replies: [] }; });
    flat.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies!.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    setComments(roots);
  }

  async function loadMembers() {
    const supabase = createClient();
    const { data } = await supabase
      .from("theater_members")
      .select("user_id, profiles(display_name)")
      .eq("theater_id", theaterId);

    if (data) {
      setMembers(data.map((m: { user_id: string; profiles?: { display_name?: string } | { display_name?: string }[] }) => ({
        user_id: m.user_id,
        display_name: m.profiles?.display_name ?? "Unbekannt",
      })));
    }
  }

  useEffect(() => {
    loadComments();
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costumeId]);

  function handleBodyChange(val: string) {
    setBody(val);
    // Detect @mention trigger
    const match = val.match(/@(\w[\w\s]*)$/);
    if (match) {
      const search = match[1].toLowerCase();
      setMentionSearch(search);
      setMentionResults(members.filter(m => m.display_name.toLowerCase().includes(search)));
    } else {
      setMentionSearch(null);
      setMentionResults([]);
    }
  }

  function insertMention(member: Member) {
    const newBody = body.replace(/@(\w[\w\s]*)$/, `@${member.display_name} `);
    setBody(newBody);
    setMentionSearch(null);
    setMentionResults([]);
    textareaRef.current?.focus();
  }

  async function handleSubmit() {
    if (!body.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("costume_comments").insert({
      costume_id: costumeId,
      user_id: currentUserId,
      body: body.trim(),
      parent_id: replyTo?.parentId ?? null,
    });
    setBody("");
    setReplyTo(null);
    await loadComments();
    setSubmitting(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Comment list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 80 }}>
        {comments.length === 0 ? (
          <p style={{
            fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
            color: "var(--neutral-grey-400)", textAlign: "center", margin: "24px 0",
          }}>
            Noch keine Kommentare. Sei der Erste!
          </p>
        ) : (
          comments.map(c => (
            <CommentBubble
              key={c.id}
              comment={c}
              onReply={(parentId, mentionName) => {
                setReplyTo({ parentId, mentionName });
                setBody(`@${mentionName} `);
                textareaRef.current?.focus();
              }}
            />
          ))
        )}
      </div>

      {/* Input area */}
      <div style={{ marginTop: 24 }}>
        {replyTo && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 8,
            fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--secondary-700)",
          }}>
            <span>Antwort an <strong>{replyTo.mentionName}</strong></span>
            <button
              type="button"
              onClick={() => { setReplyTo(null); setBody(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neutral-grey-400)", fontSize: "var(--font-size-300)", padding: 0 }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ position: "relative" }}>
          {/* @mention dropdown */}
          {mentionSearch !== null && mentionResults.length > 0 && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0,
              background: "#FFFFFF", border: "1px solid var(--secondary-700)",
              borderRadius: 10, boxShadow: "var(--shadow-300)", zIndex: 100, overflow: "hidden",
            }}>
              {mentionResults.map(m => (
                <button
                  key={m.user_id}
                  type="button"
                  onMouseDown={() => insertMention(m)}
                  style={{
                    width: "100%", height: 44, display: "flex", alignItems: "center", gap: 10,
                    padding: "0 14px", background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--secondary-800)",
                    textAlign: "left",
                  }}
                >
                  <Avatar name={m.display_name} size={28} />
                  {m.display_name}
                </button>
              ))}
            </div>
          )}

          <div style={{
            border: "1px solid var(--secondary-700)", borderRadius: 16,
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px" }}>
              <Avatar name={currentUserName} size={36} />
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Kommentar schreiben… @Name für Erwähnungen"
                rows={3}
                style={{
                  flex: 1, border: "none", outline: "none", resize: "none",
                  fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-250)",
                  color: "var(--neutral-grey-600)", lineHeight: 1.55,
                  background: "transparent",
                }}
              />
            </div>
            {/* Footer */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              padding: "10px 16px",
              borderTop: "1px solid var(--neutral-grey-200)",
              background: "var(--neutral-grey-50, #FAFAFA)",
            }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !body.trim()}
                style={{
                  height: 38, padding: "0 20px", borderRadius: 10,
                  background: body.trim() ? "var(--secondary-700)" : "var(--neutral-grey-200)",
                  border: "none", cursor: body.trim() ? "pointer" : "default",
                  fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: 600,
                  color: body.trim() ? "var(--neutral-white)" : "var(--neutral-grey-400)",
                  transition: "background 150ms",
                }}
              >
                {submitting ? "Speichert…" : "Kommentieren"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
