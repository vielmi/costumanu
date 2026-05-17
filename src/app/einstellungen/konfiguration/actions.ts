"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 100;

function validateNameAndSlug(name: string, slug: string) {
  if (!name.trim()) throw new Error("Name darf nicht leer sein");
  if (name.trim().length > MAX_NAME_LENGTH)
    throw new Error(`Name darf maximal ${MAX_NAME_LENGTH} Zeichen haben`);
  if (!slug.trim()) throw new Error("Slug darf nicht leer sein");
  const normalized = slug.trim().toLowerCase().replace(/\s+/g, "-");
  if (!SLUG_PATTERN.test(normalized))
    throw new Error("Slug darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten");
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function assertAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");

  // Use admin client to bypass RLS — same as konfiguration/page.tsx
  const admin = getAdminClient();
  const { data: profile } = await admin
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

export async function createTheaterAction(formData: { name: string; slug: string }) {
  validateNameAndSlug(formData.name, formData.slug);
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
  validateNameAndSlug(formData.name, formData.slug);
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

export async function deleteTheaterAction(theaterId: string) {
  const { isPlatformAdmin } = await assertAdmin();
  if (!isPlatformAdmin) throw new Error("Keine Berechtigung");
  const admin = getAdminClient();

  const { error } = await admin.from("theaters").delete().eq("id", theaterId);
  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
}

export async function updateTheaterContactAction(formData: {
  theaterId: string;
  contactName: string;
  contactEmail: string;
}) {
  const { theaterId: adminTheaterId, isPlatformAdmin } = await assertAdmin();

  if (!isPlatformAdmin && adminTheaterId !== formData.theaterId) {
    throw new Error("Keine Berechtigung");
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("theaters")
    .update({
      contact_name: formData.contactName.trim() || null,
      contact_email: formData.contactEmail.trim() || null,
    })
    .eq("id", formData.theaterId);

  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
}

export async function updateTheaterAddressAction(formData: {
  theaterId: string;
  venue: string;
  street: string;
  zip: string;
  city: string;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");

  const { data: membership } = await supabase
    .from("theater_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("theater_id", formData.theaterId)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Keine Berechtigung");
  }

  const address_info: Record<string, string> = {};
  if (formData.venue.trim()) address_info.venue = formData.venue.trim();
  if (formData.street.trim()) address_info.street = formData.street.trim();
  if (formData.zip.trim()) address_info.zip = formData.zip.trim();
  if (formData.city.trim()) address_info.city = formData.city.trim();

  const admin = getAdminClient();
  const { error } = await admin
    .from("theaters")
    .update({ address_info })
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
  theaterId?: string;
  platformAdmin?: boolean;
}) {
  const { theaterId: adminTheaterId, isPlatformAdmin } = await assertAdmin();
  const admin = getAdminClient();

  const targetTheaterId = isPlatformAdmin ? formData.theaterId : adminTheaterId;
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
    platform_role: formData.platformAdmin ? "platform_admin" : null,
  });
  if (profileErr) throw new Error("Profil konnte nicht erstellt werden: " + profileErr.message);

  const { error: memberErr } = await admin.from("theater_members").upsert({
    user_id: uid,
    theater_id: targetTheaterId,
    role: formData.role,
  });
  if (memberErr) throw new Error("Theater-Zuweisung fehlgeschlagen: " + memberErr.message);

  revalidatePath("/einstellungen/konfiguration");
  return { userId: uid };
}

export async function updateUserAction(formData: {
  userId: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  theaterId: string;
  platformAdmin?: boolean;
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
    platform_role: formData.platformAdmin ? "platform_admin" : null,
    updated_at: new Date().toISOString(),
  });

  await admin
    .from("theater_members")
    .update({ role: formData.role })
    .eq("user_id", formData.userId)
    .eq("theater_id", formData.theaterId);

  revalidatePath("/einstellungen/konfiguration");
}

// ─── Network actions (network admin) ─────────────────────────────────────────

export async function updateNetworkSettingsAction(formData: {
  networkId: string;
  name: string;
  description: string;
  defaultVisibility: "none" | "all";
}) {
  if (!formData.name.trim()) throw new Error("Name darf nicht leer sein");
  if (formData.name.trim().length > 100) throw new Error("Name zu lang");

  // Use server client — RLS enforces network admin permission
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");

  const { error } = await supabase
    .from("theater_networks")
    .update({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      default_visibility: formData.defaultVisibility,
    })
    .eq("id", formData.networkId);

  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
}

// ─── Network actions (platform admin only) ───────────────────────────────────

export async function createNetworkAction(formData: { name: string; slug: string }) {
  validateNameAndSlug(formData.name, formData.slug);
  const { isPlatformAdmin } = await assertAdmin();
  if (!isPlatformAdmin) throw new Error("Keine Berechtigung");
  const admin = getAdminClient();

  const slug = formData.slug.trim().toLowerCase().replace(/\s+/g, "-");
  const { data, error } = await admin
    .from("theater_networks")
    .insert({ name: formData.name.trim(), slug })
    .select("id, name, slug")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
  return data as { id: string; name: string; slug: string };
}

export async function deleteNetworkAction(networkId: string) {
  const { isPlatformAdmin } = await assertAdmin();
  if (!isPlatformAdmin) throw new Error("Keine Berechtigung");
  const admin = getAdminClient();

  const { error } = await admin.from("theater_networks").delete().eq("id", networkId);
  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
}

export async function addTheaterToNetworkAction(formData: {
  networkId: string;
  theaterId: string;
  networkRole: "member" | "admin";
}) {
  const { isPlatformAdmin } = await assertAdmin();
  if (!isPlatformAdmin) throw new Error("Keine Berechtigung");
  const admin = getAdminClient();

  const { error } = await admin.from("theater_network_members").upsert({
    network_id: formData.networkId,
    theater_id: formData.theaterId,
    network_role: formData.networkRole,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
}

export async function removeTheaterFromNetworkAction(formData: {
  networkId: string;
  theaterId: string;
}) {
  const { isPlatformAdmin } = await assertAdmin();
  if (!isPlatformAdmin) throw new Error("Keine Berechtigung");
  const admin = getAdminClient();

  const { error } = await admin
    .from("theater_network_members")
    .delete()
    .eq("network_id", formData.networkId)
    .eq("theater_id", formData.theaterId);
  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
}

// ─── Theater Location actions (theater admin) ─────────────────────────────────

export async function createLocationAction(formData: {
  theaterId: string;
  name: string;
  street: string;
  zip: string;
  city: string;
}) {
  if (!formData.name.trim()) throw new Error("Name darf nicht leer sein");
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");

  const { data: membership } = await supabase
    .from("theater_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("theater_id", formData.theaterId)
    .single();
  if (!membership || !["owner", "admin"].includes(membership.role))
    throw new Error("Keine Berechtigung");

  const admin = getAdminClient();
  const { data: existing } = await admin
    .from("theater_locations")
    .select("sort_order")
    .eq("theater_id", formData.theaterId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = existing ? existing.sort_order + 1 : 0;

  const { data, error } = await admin
    .from("theater_locations")
    .insert({
      theater_id: formData.theaterId,
      name: formData.name.trim(),
      street: formData.street.trim() || null,
      zip: formData.zip.trim() || null,
      city: formData.city.trim() || null,
      sort_order,
    })
    .select("id, theater_id, name, street, zip, city, sort_order")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
  return data;
}

export async function updateLocationAction(formData: {
  locationId: string;
  theaterId: string;
  name: string;
  street: string;
  zip: string;
  city: string;
}) {
  if (!formData.name.trim()) throw new Error("Name darf nicht leer sein");
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");

  const { data: membership } = await supabase
    .from("theater_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("theater_id", formData.theaterId)
    .single();
  if (!membership || !["owner", "admin"].includes(membership.role))
    throw new Error("Keine Berechtigung");

  const admin = getAdminClient();
  const { error } = await admin
    .from("theater_locations")
    .update({
      name: formData.name.trim(),
      street: formData.street.trim() || null,
      zip: formData.zip.trim() || null,
      city: formData.city.trim() || null,
    })
    .eq("id", formData.locationId)
    .eq("theater_id", formData.theaterId);

  if (error) throw new Error(error.message);
  revalidatePath("/einstellungen/konfiguration");
}

export async function deleteLocationAction(locationId: string, theaterId: string) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");

  const { data: membership } = await supabase
    .from("theater_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("theater_id", theaterId)
    .single();
  if (!membership || !["owner", "admin"].includes(membership.role))
    throw new Error("Keine Berechtigung");

  const admin = getAdminClient();
  const { error } = await admin
    .from("theater_locations")
    .delete()
    .eq("id", locationId)
    .eq("theater_id", theaterId);

  if (error) throw new Error(error.message);
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
