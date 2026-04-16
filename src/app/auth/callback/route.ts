import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Supabase sets amr to "recovery" when the session comes from a password reset link
      const isRecovery =
        type === "recovery" ||
        (data.session as { amr?: { method: string }[] } | null)?.amr?.some(
          (entry) => entry.method === "recovery",
        );
      if (isRecovery) {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      return NextResponse.redirect(`${origin}/wishlist`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
