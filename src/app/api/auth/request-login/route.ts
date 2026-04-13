import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createPrivilegedSupabase } from "@/lib/supabase/adminAuth";

function parseRedirectTo(request: NextRequest, redirectTo: string) {
  let parsed: URL;

  try {
    parsed = new URL(redirectTo);
  } catch {
    return null;
  }

  if (parsed.origin !== request.nextUrl.origin || parsed.pathname !== "/login") {
    return null;
  }

  return parsed.toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = (await request.json()) as {
      email?: string;
      redirectTo?: string;
    };

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !redirectTo) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    const safeRedirectTo = parseRedirectTo(request, redirectTo);
    if (!safeRedirectTo) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    const privileged = createPrivilegedSupabase();
    if (!privileged) {
      return NextResponse.json({ error: "SERVER_MISCONFIGURED" }, { status: 500 });
    }

    // Rate limiting completely disabled per request.

    const { data: profile, error: profileError } = await privileged
      .from("profiles")
      .select("id, status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "PROFILE_LOOKUP_FAILED" }, { status: 500 });
    }

    if (!profile || profile.status === "disabled") {
      return NextResponse.json({ ok: true });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ error: "SERVER_MISCONFIGURED" }, { status: 500 });
    }

    const authClient = createSupabaseClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // [DEV ONLY] Bypass SMTP by generating link directly
    if (process.env.NODE_ENV === "development") {
      const { data: linkData, error: linkError } = await privileged.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: {
          redirectTo: safeRedirectTo,
        },
      });

      if (linkError) {
        console.error("[DEV] admin.generateLink error:", linkError);
        return NextResponse.json({ error: "OTP_SEND_FAILED", details: linkError.message }, { status: 500 });
      }

      // In dev mode, return the action link directly to the browser.
      // The browser will navigate to it, GoTrue will capture the hash,
      // sync the client session correctly, and save to cookies natively.
      console.log(`[DEV MODE] Auto-login triggered for ${normalizedEmail}. Redirecting to action_link...`);
      return NextResponse.json({ ok: true, devModeActionLink: linkData.properties.action_link });
    }

    const { error } = await authClient.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: safeRedirectTo,
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error("OTP send error:", error);
      return NextResponse.json({ error: "OTP_SEND_FAILED", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth/request-login] error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
