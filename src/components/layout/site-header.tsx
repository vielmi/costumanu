"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, MessageCircle, Heart, ShoppingBag, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationMenu } from "@/components/layout/navigation-menu";
import { AppLogo } from "@/components/layout/app-logo";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50" style={{ background: "var(--secondary-500)", height: 72, display: "flex", alignItems: "center" }}>
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4">
          <AppLogo />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Menü schliessen" : "Menü öffnen"}
          >
            <Menu className="h-5 w-5" />
          </Button>

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
              <Link href="/messages">
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
              <Link href="/wishlist">
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
              <Link href="/rental">
                <ShoppingBag className="h-5 w-5" />
                <span className="sr-only">Ausleihe</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <NavigationMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
