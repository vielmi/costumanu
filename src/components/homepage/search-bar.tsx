"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";

export function SearchBar() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q")?.toString().trim();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="costume-filter" className="sr-only">
          {t("results.costumeFilter")}
        </label>
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          id="costume-filter"
          name="q"
          type="search"
          placeholder={t("home.searchPlaceholder")}
          className="rounded-full pr-4 pl-10"
        />
      </form>
    </div>
  );
}
