import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Building2, Phone, Mail } from "lucide-react";
import { t } from "@/lib/i18n";

export default async function ProfilPage() {
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, professional_title, avatar_url, phone")
    .eq("id", user.id)
    .single();

  // Fetch theater memberships with theater details
  const { data: memberships } = await supabase
    .from("theater_members")
    .select(
      `
      role,
      theaters (
        id,
        name,
        slug
      )
    `
    )
    .eq("user_id", user.id);

  const displayName =
    profile?.display_name ?? user.user_metadata?.full_name ?? t("messages.unknown");
  const professionalTitle = profile?.professional_title ?? null;
  const avatarUrl = profile?.avatar_url ?? null;
  const phone = profile?.phone ?? null;
  const email = user.email ?? null;

  const theaterList = (memberships ?? []).map((m) => {
    const theater = m.theaters as unknown as { id: string; name: string; slug: string };
    return {
      id: theater.id,
      name: theater.name,
      slug: theater.slug,
      role: m.role as string,
    };
  });

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{t("profile.title")}</h1>

        {/* Profile card */}
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-20 w-20 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                {getInitials(displayName)}
              </div>
            )}

            {/* Name and title */}
            <div className="flex flex-1 flex-col items-center gap-1 sm:items-start">
              <h2 className="text-xl font-semibold">{displayName}</h2>
              {professionalTitle && (
                <p className="text-sm text-muted-foreground">
                  {professionalTitle}
                </p>
              )}
              {theaterList.length > 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{theaterList.map((th) => th.name).join(", ")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t("profile.contactDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.phone")}
                  </p>
                  <p className="text-sm">{phone}</p>
                </div>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.email")}
                  </p>
                  <p className="text-sm">{email}</p>
                </div>
              </div>
            )}
            {!phone && !email && (
              <p className="text-sm text-muted-foreground">
                {t("profile.noContactDetails")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Theater memberships */}
        {theaterList.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">{t("profile.theaters")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {theaterList.map((theater) => (
                <div
                  key={theater.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-medium">
                      {theater.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{theater.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {theater.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/profile/edit">
              <Pencil className="h-4 w-4" />
              {t("profile.editProfile")}
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/profile/theaters">
              <Building2 className="h-4 w-4" />
              {t("profile.manageTheaters")}
            </Link>
          </Button>
        </div>
      </main>
    </AppShell>
  );
}
