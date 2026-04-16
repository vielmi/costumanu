"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function assertAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");

  // Check platform admin first
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role === "platform_admin") {
    return { userId: user.id, theaterId: null as string | null, isPlatformAdmin: true };
  }

  // Fall back to theater-level admin check
  const { data: membership } = await supabase
    .from("theater_members")
    .select("theater_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Keine Berechtigung");
  }
  return { userId: user.id, theaterId: membership.theater_id, isPlatformAdmin: false };
}

// ─── Theater actions (platform admin only) ────────────────────────────────────

export async function createTheaterAction(formData: {
  name: string;
  slug: string;
}) {
  const { isPlatformAdmin } = await assertAdmin();
  if (!isPlatformAdmin) throw new Error("Keine Berechtigung");
  const admin = getAdminClient();

  const slug = formData.slug.trim().toLowerCase().replace(/\s+/g, "-");
  const { data, error } = await admin
    .from("theaters")
    .insert({ name: formData.name.trim(), slug })
    .select("id, name, slug")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
  return data as { id: string; name: string; slug: string };
}

export async function updateTheaterAction(formData: {
  theaterId: string;
  name: string;
  slug: string;
}) {
  const { isPlatformAdmin } = await assertAdmin();
  if (!isPlatformAdmin) throw new Error("Keine Berechtigung");
  const admin = getAdminClient();

  const slug = formData.slug.trim().toLowerCase().replace(/\s+/g, "-");
  const { error } = await admin
    .from("theaters")
    .update({ name: formData.name.trim(), slug })
    .eq("id", formData.theaterId);

  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
}

// ─── User actions ─────────────────────────────────────────────────────────────

export async function createUserAction(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  theaterId?: string; // platform admin can specify target theater
}) {
  const { theaterId: adminTheaterId, isPlatformAdmin } = await assertAdmin();
  const admin = getAdminClient();

  const targetTheaterId = isPlatformAdmin
    ? formData.theaterId
    : adminTheaterId;
  if (!targetTheaterId) throw new Error("Theater-ID fehlt");

  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
  });
  if (createErr || !newUser.user) throw new Error(createErr?.message ?? "Fehler beim Erstellen");

  const uid = newUser.user.id;

  const { error: profileErr } = await admin.from("profiles").upsert({
    id: uid,
    display_name: `${formData.firstName} ${formData.lastName}`.trim(),
  });
  if (profileErr) throw new Error("Profil konnte nicht erstellt werden: " + profileErr.message);

  const { error: memberErr } = await admin.from("theater_members").upsert({
    user_id: uid,
    theater_id: targetTheaterId,
    role: formData.role,
  });
  if (memberErr) throw new Error("Theater-Zuweisung fehlgeschlagen: " + memberErr.message);

  revalidatePath("/einstellungen/konfiguration");
}

export async function updateUserAction(formData: {
  userId: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  theaterId: string; // which theater's membership to update
}) {
  await assertAdmin();
  const admin = getAdminClient();

  const authUpdate: { email?: string; password?: string } = {};
  if (formData.email) authUpdate.email = formData.email;
  if (formData.password) authUpdate.password = formData.password;
  if (Object.keys(authUpdate).length) {
    await admin.auth.admin.updateUserById(formData.userId, authUpdate);
  }

  await admin.from("profiles").upsert({
    id: formData.userId,
    display_name: `${formData.firstName} ${formData.lastName}`.trim(),
    updated_at: new Date().toISOString(),
  });

  await admin
    .from("theater_members")
    .update({ role: formData.role })
    .eq("user_id", formData.userId)
    .eq("theater_id", formData.theaterId);

  revalidatePath("/einstellungen/konfiguration");
}

export async function deleteUserAction(userId: string) {
  await assertAdmin();
  const admin = getAdminClient();

  // Remove dependent rows first to avoid FK constraint errors
  await admin.from("theater_members").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);

  const { error } = await admin.auth.admin.deleteUser(userId);
  // Ignore "not found" — DB records already cleaned up, auth user was already gone
  if (error && !error.message.toLowerCase().includes("not found")) {
    throw new Error(error.message);
  }
  revalidatePath("/einstellungen/konfiguration");
}
