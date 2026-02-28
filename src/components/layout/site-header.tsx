"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, MessageCircle, Heart, ShoppingBag, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface-dark text-surface-dark-foreground">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-surface-dark-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Menü schliessen" : "Menü öffnen"}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/" className="text-lg font-bold tracking-tight">
          kostüm+
        </Link>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-surface-dark-foreground"
            asChild
          >
            <Link href="/fundus">
              <Archive className="h-5 w-5" />
              <span className="sr-only">Fundus</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-surface-dark-foreground"
            asChild
          >
            <Link href="/nachrichten">
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">Nachrichten</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-surface-dark-foreground"
            asChild
          >
            <Link href="/merkliste">
              <Heart className="h-5 w-5" />
              <span className="sr-only">Merkliste</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-surface-dark-foreground"
            asChild
          >
            <Link href="/ausleihe">
              <ShoppingBag className="h-5 w-5" />
              <span className="sr-only">Ausleihe</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
