import { AppShell } from "@/components/layout/app-shell";

export default async function AuffuehrungenPage() {
  return (
    <AppShell>
      <div style={{ padding: 40 }}>
        <h1 style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-600)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-700)", margin: 0 }}>
          Aufführungen
        </h1>
      </div>
    </AppShell>
  );
}
