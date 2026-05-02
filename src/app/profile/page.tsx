import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
import styles from "./profile.module.css";

export default async function ProfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, professional_title, avatar_url, phone")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("theater_members")
    .select(`role, theaters ( id, name, slug )`)
    .eq("user_id", user.id);

  const displayName =
    profile?.display_name ?? user.user_metadata?.full_name ?? "Unbekannt";
  const professionalTitle = profile?.professional_title ?? null;
  const avatarUrl = profile?.avatar_url ?? null;
  const phone = profile?.phone ?? null;
  const email = user.email ?? null;

  const theaterList = (memberships ?? []).map((m) => {
    const theater = m.theaters as unknown as { id: string; name: string; slug: string };
    return { id: theater.id, name: theater.name, slug: theater.slug, role: m.role as string };
  });

  function getInitials(name: string): string {
    return name.split(" ").map((p) => p.charAt(0)).join("").toUpperCase().slice(0, 2);
  }

  return (
    <AppShell>
      <div className={styles.page}>
        <AppMobileHeader />

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.avatar}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
            ) : (
              <span className={styles.avatarInitials}>{getInitials(displayName)}</span>
            )}
          </div>
          <h1 className={styles.heroName}>{displayName}</h1>
          {professionalTitle && <p className={styles.heroTitle}>{professionalTitle}</p>}
        </div>

        <div className={styles.divider} />

        {/* Kontaktdaten */}
        <section className={styles.section}>
          <p className={styles.sectionTitle}>Kontakt</p>
          {phone && (
            <div className={styles.row}>
              <div className={styles.rowIcon}>
                <Image src="/icons/icon-phone.svg" alt="" width={18} height={18} />
              </div>
              <div className={styles.rowBody}>
                <p className={styles.rowLabel}>Telefon</p>
                <p className={styles.rowValue}>{phone}</p>
              </div>
            </div>
          )}
          {email && (
            <div className={styles.row}>
              <div className={styles.rowIcon}>
                <Image src="/icons/icon-mail.svg" alt="" width={18} height={18} />
              </div>
              <div className={styles.rowBody}>
                <p className={styles.rowLabel}>E-Mail</p>
                <p className={styles.rowValue}>{email}</p>
              </div>
            </div>
          )}
          {!phone && !email && (
            <div className={styles.row}>
              <p className={styles.rowValue} style={{ color: "var(--neutral-grey-400)" }}>
                Keine Kontaktdaten hinterlegt.
              </p>
            </div>
          )}
        </section>

        <div className={styles.divider} />

        {/* Theater */}
        {theaterList.length > 0 && (
          <>
            <section className={styles.section}>
              <p className={styles.sectionTitle}>Theater</p>
              {theaterList.map((theater) => (
                <div key={theater.id} className={styles.row}>
                  <div className={styles.theaterBadge}>
                    {theater.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.rowBody}>
                    <p className={styles.rowValue}>{theater.name}</p>
                    <p className={styles.theaterRole}>{theater.role}</p>
                  </div>
                </div>
              ))}
            </section>
            <div className={styles.divider} />
          </>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/profile/edit" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
            <Image src="/icons/icon-edit.svg" alt="" width={20} height={20} style={{ filter: "invert(1)" }} />
            Profil bearbeiten
          </Link>
          <Link href="/profile/theaters" className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}>
            Theater verwalten
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
