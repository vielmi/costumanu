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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="costume-filter"
          name="q"
          type="search"
          placeholder={t("home.searchPlaceholder")}
          className="rounded-full pl-10 pr-4"
        />
      </form>
    </div>
  );
}
