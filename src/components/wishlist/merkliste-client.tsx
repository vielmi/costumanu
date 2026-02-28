"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Heart,
  MoreVertical,
  Trash2,
  Edit2,
  Share2,
  Archive,
} from "lucide-react";

interface Wishlist {
  id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  item_count: number;
}

interface MerklisteClientProps {
  initialWishlists: Wishlist[];
  theaterId: string;
  userId: string;
}

export function MerklisteClient({
  initialWishlists,
  theaterId,
  userId,
}: MerklisteClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Wishlist | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------
  const { data: wishlists } = useQuery({
    queryKey: ["wishlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("id, name, is_archived, created_at, item_count")
        .eq("owner_id", userId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map((w) => ({
        ...w,
        item_count: (w as Record<string, unknown>).item_count
          ? Number((w as Record<string, unknown>).item_count)
          : 0,
      })) as Wishlist[];
    },
    initialData: initialWishlists,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: async (wishlistName: string) => {
      const { data, error } = await supabase
        .from("wishlists")
        .insert({
          name: wishlistName,
          theater_id: theaterId,
          owner_id: userId,
        })
        .select("id, name, is_archived, created_at")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
      setNewName("");
      setShowCreateForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("wishlists")
        .update({ name })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
      setRenameDialogOpen(false);
      setRenameTarget(null);
      setRenameValue("");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wishlists")
        .update({ is_archived: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  }

  function openRenameDialog(wishlist: Wishlist) {
    setRenameTarget(wishlist);
    setRenameValue(wishlist.name);
    setRenameDialogOpen(true);
  }

  function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (!trimmed || !renameTarget) return;
    renameMutation.mutate({ id: renameTarget.id, name: trimmed });
  }

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filteredWishlists = wishlists.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("wishlist.title")}</h1>
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("wishlist.searchPlaceholder")}
            className="pl-9"
          />
        </div>
      </div>

      {/* Create button / inline form */}
      {showCreateForm ? (
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("wishlist.nameLabel")}
            className="max-w-sm"
            autoFocus
          />
          <Button
            type="submit"
            disabled={createMutation.isPending || !newName.trim()}
          >
            {createMutation.isPending ? "Erstellen..." : t("wishlist.createNew")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setShowCreateForm(false);
              setNewName("");
            }}
          >
            {t("common.cancel")}
          </Button>
        </form>
      ) : (
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("wishlist.createNew")}
        </Button>
      )}

      {createMutation.isError && (
        <p className="text-sm text-destructive">
          {t("common.error")}: {(createMutation.error as Error).message}
        </p>
      )}

      {/* Wishlist cards */}
      {filteredWishlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16">
          <Heart className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground font-medium">
            {t("wishlist.noWishlists")}
          </p>
          <p className="text-muted-foreground text-sm">
            {t("wishlist.noWishlistsDescription")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredWishlists.map((wishlist) => (
            <Card key={wishlist.id} className="py-3 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between">
                <div
                  className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1"
                  onClick={() => router.push(`/wishlist/${wishlist.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/wishlist/${wishlist.id}`);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{wishlist.name}</p>
                    <Badge variant="secondary" className="shrink-0">
                      {wishlist.item_count}{" "}
                      {wishlist.item_count === 1
                        ? t("common.costume")
                        : t("common.costumes")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(wishlist.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Action menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">{t("wishlist.actions")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openRenameDialog(wishlist)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      {t("common.rename")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {/* Share handler — placeholder */}}>
                      <Share2 className="mr-2 h-4 w-4" />
                      {t("common.share")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => archiveMutation.mutate(wishlist.id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      {t("common.archive")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => deleteMutation.mutate(wishlist.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rename dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.rename")}</DialogTitle>
            <DialogDescription>{t("wishlist.nameLabel")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRename} className="flex flex-col gap-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder={t("wishlist.nameLabel")}
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={renameMutation.isPending || !renameValue.trim()}
              >
                {renameMutation.isPending
                  ? t("common.loading")
                  : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
