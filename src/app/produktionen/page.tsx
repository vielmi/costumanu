import { AppShell } from "@/components/layout/app-shell";
import { ProduktionenTopBar } from "@/components/produktionen/produktionen-top-bar";
import { ProduktionenClient } from "@/components/produktionen/produktionen-client";

export default async function ProdukionenPage() {
  return (
    <AppShell topBar={<ProduktionenTopBar />}>
      <ProduktionenClient />
    </AppShell>
  );
}
