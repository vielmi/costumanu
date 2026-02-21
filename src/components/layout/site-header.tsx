import Link from "next/link";
import { Menu, MessageCircle, Heart, ShoppingBag, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-surface-dark text-surface-dark-foreground">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Button variant="ghost" size="icon" className="text-surface-dark-foreground">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menü</span>
        </Button>

        <span className="text-lg font-bold tracking-tight">kostüm+</span>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-surface-dark-foreground" asChild>
            <Link href="/fundus">
              <Archive className="h-5 w-5" />
              <span className="sr-only">Fundus</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="text-surface-dark-foreground">
            <MessageCircle className="h-5 w-5" />
            <span className="sr-only">Chat</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-surface-dark-foreground" asChild>
            <Link href="/merkliste">
              <Heart className="h-5 w-5" />
              <span className="sr-only">Merkliste</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="text-surface-dark-foreground">
            <ShoppingBag className="h-5 w-5" />
            <span className="sr-only">Warenkorb</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
