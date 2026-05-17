import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: "Kontakte" };

export default async function KontaktePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <div style={{ padding: 40 }}>
        <h1
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-600)",
            fontWeight: "var(--font-weight-700)",
            color: "var(--neutral-grey-700)",
            margin: 0,
          }}
        >
          Kontakte
        </h1>
      </div>
    </AppShell>
  );
}
