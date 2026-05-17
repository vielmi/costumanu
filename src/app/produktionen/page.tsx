import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ProduktionenTopBar } from "@/components/produktionen/produktionen-top-bar";
import { ProduktionenClient } from "@/components/produktionen/produktionen-client";

export const metadata: Metadata = { title: "Produktionen" };

export default async function ProdukionenPage() {
  return (
    <AppShell topBar={<ProduktionenTopBar />}>
      <ProduktionenClient />
    </AppShell>
  );
}
