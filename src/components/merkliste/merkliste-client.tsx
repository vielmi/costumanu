"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface Wishlist {
  id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
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
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: wishlists } = useQuery({
    queryKey: ["wishlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("id, name, is_archived, created_at")
        .eq("owner_id", userId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Wishlist[];
    },
    initialData: initialWishlists,
  });

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
      setName("");
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

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Merkliste</h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name der neuen Liste..."
          className="max-w-sm"
        />
        <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
          {createMutation.isPending ? "Erstellen..." : "Erstellen"}
        </Button>
      </form>

      {createMutation.isError && (
        <p className="text-sm text-destructive">
          Fehler: {(createMutation.error as Error).message}
        </p>
      )}

      {wishlists.length === 0 ? (
        <p className="text-muted-foreground">
          Noch keine Merklisten vorhanden. Erstelle deine erste Liste!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {wishlists.map((wishlist) => (
            <Card key={wishlist.id} className="py-3">
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{wishlist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(wishlist.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(wishlist.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Löschen</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
