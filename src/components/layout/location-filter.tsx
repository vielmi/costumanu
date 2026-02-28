"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Theater = {
  id: string;
  name: string;
  slug: string;
};

type LocationFilterProps = {
  open: boolean;
  onClose: () => void;
  selectedTheaterIds: string[];
  onSave: (theaterIds: string[]) => void;
};

export function LocationFilter({
  open,
  onClose,
  selectedTheaterIds,
  onSave,
}: LocationFilterProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedTheaterIds)
  );
  const [allLocations, setAllLocations] = useState(
    selectedTheaterIds.length === 0
  );

  const supabase = createClient();

  const { data: theaters } = useQuery({
    queryKey: ["theaters-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theaters")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data as Theater[];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Sync external prop changes
  useEffect(() => {
    setSelected(new Set(selectedTheaterIds));
    setAllLocations(selectedTheaterIds.length === 0);
  }, [selectedTheaterIds]);

  function toggleTheater(theaterId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(theaterId)) {
        next.delete(theaterId);
      } else {
        next.add(theaterId);
      }
      return next;
    });
    setAllLocations(false);
  }

  function handleAllLocationsToggle(checked: boolean) {
    setAllLocations(checked);
    if (checked) {
      setSelected(new Set());
    }
  }

  function handleSave() {
    onSave(allLocations ? [] : Array.from(selected));
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="flex max-h-[80vh] flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Standorte durchsuchen
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Alle Standorte toggle */}
          <div className="mb-4 flex items-center justify-between rounded-lg border p-3">
            <Label
              htmlFor="all-locations"
              className="text-sm font-medium"
            >
              Alle Standorte durchsuchen
            </Label>
            <Switch
              id="all-locations"
              checked={allLocations}
              onCheckedChange={handleAllLocationsToggle}
            />
          </div>

          {/* Theater list */}
          <div className="flex flex-col gap-1">
            {(theaters ?? []).map((theater) => (
              <label
                key={theater.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={selected.has(theater.id)}
                  onCheckedChange={() => toggleTheater(theater.id)}
                  disabled={allLocations}
                />
                <span
                  className={`text-sm ${allLocations ? "text-muted-foreground" : ""}`}
                >
                  {theater.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="border-t pt-4">
          <Button
            onClick={handleSave}
            className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
          >
            speichern & schliessen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
