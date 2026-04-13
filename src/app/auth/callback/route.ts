import { NextResponse } from "next/server";

import { logAuditEventSafely } from "@/lib/audit";
import { sendTeacherLoginAlert } from "@/lib/notifications/email";
import { createPrivilegedSupabase } from "@/lib/supabase/privileged";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }

  const supabase = await createClient();
  const privileged = createPrivilegedSupabase();
  const profileReader = privileged ?? supabase;

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }

  const { data: profile, error: profileError } = await profileReader
    .from("profiles")
    .select("role, status, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[auth/callback] profile lookup failed:", profileError.message);
  }

  if (!profile || profile.status === "disabled") {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }

  const role = profile.role ?? "student";
  const status = profile.status ?? "active";

  if (privileged && (role === "teacher" || role === "admin")) {
    await logAuditEventSafely(privileged, {
      actorId: user.id,
      actorEmail: user.email,
      actorName: profile.full_name,
      actorRole: role,
      action: "auth.login",
      targetType: "session",
      targetLabel: user.email,
      metadata: {
        role,
        status,
      },
    });
  }

  if (role === "teacher") {
    try {
      await sendTeacherLoginAlert({
        teacherEmail: user.email,
        teacherName: profile.full_name,
      });
    } catch (notifyError) {
      console.error("[auth/callback] teacher login alert failed:", notifyError);
    }

    if (status === "pending") {
      return NextResponse.redirect(
        new URL("/pending-approval?login_notified=1", request.url),
      );
    }

    return NextResponse.redirect(new URL("/teacher?login_notified=1", request.url));
  }

  if (role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
