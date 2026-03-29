"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleResetPassword() {
    if (!email) {
      setError(t("auth.enterEmail"));
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?type=recovery` }
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetSent(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/wishlist");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto flex max-w-md items-center justify-center px-4 py-16">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {isSignUp ? t("auth.signUp") : t("auth.signIn")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {resetSent && (
                <p className="text-sm text-green-600">
                  {t("auth.resetSent", { email })}
                </p>
              )}

              <Button type="submit" disabled={loading}>
                {loading
                  ? t("common.loading")
                  : isSignUp
                    ? t("auth.signUp")
                    : t("auth.signIn")}
              </Button>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  {t("auth.forgotPassword")}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setResetSent(false);
                }}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {isSignUp
                  ? t("auth.alreadyRegistered")
                  : t("auth.noAccount")}
              </button>
            </form>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
