"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";
import { AppLogo } from "@/components/layout/app-logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile row (display_name is NOT NULL in schema)
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          display_name: displayName.trim() || email.split("@")[0],
        },
        { onConflict: "id" }
      );
    }

    if (data.session) {
      // Email confirmation disabled — user is immediately logged in
      router.push("/suchmodus");
      router.refresh();
    } else {
      // Email confirmation required
      setConfirmationSent(true);
      setLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--page-bg)",
        }}
      >
        <div
          style={{
            height: 72,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
          }}
        >
          <AppLogo />
        </div>
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: "var(--neutral-white)",
            borderRadius: "var(--radius-panel) var(--radius-panel) 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 16px",
          }}
        >
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center text-sm">
                {t("auth.confirmationSent", { email })}
              </p>
              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm underline-offset-4 hover:underline">
                  {t("auth.alreadyRegistered")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--page-bg)",
      }}
    >
      <div
        style={{
          height: 72,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <AppLogo />
      </div>

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          background: "var(--neutral-white)",
          borderRadius: "var(--radius-panel) var(--radius-panel) 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
        }}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-xl">{t("auth.registerTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="displayName" className="text-sm font-medium">
                  {t("auth.displayName")}
                </label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("auth.displayNamePlaceholder")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  {t("auth.email")}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  {t("auth.password")}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                  minLength={6}
                />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button type="submit" disabled={loading}>
                {loading ? t("common.loading") : t("auth.signUp")}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-muted-foreground text-sm underline-offset-4 hover:underline"
                >
                  {t("auth.alreadyRegistered")}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
