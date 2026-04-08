import { AppShell } from "@/components/layout/app-shell";

export default async function DarstellerPage() {
  return (
    <AppShell>
      <div style={{ padding: 40 }}>
        <h1 style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-600)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-700)", margin: 0 }}>
          Darsteller
        </h1>
      </div>
    </AppShell>
  );
}
