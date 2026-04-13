import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createPrivilegedSupabase } from "@/lib/supabase/privileged";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const privileged = createPrivilegedSupabase();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const redirectToDashboard = () => NextResponse.redirect(new URL("/dashboard", request.url));

  let cachedProfile: { role: string; status: string } | null = null;
  let didFetchProfile = false;

  const getProfile = async () => {
    if (didFetchProfile) return cachedProfile;
    didFetchProfile = true;
    const profileReader = (privileged ??
      (supabase as unknown as SupabaseClient)) as SupabaseClient;
    const { data: profile, error } = await profileReader
      .from("profiles")
      .select("role, status")
      .eq("id", user?.id ?? "")
      .maybeSingle();
    if (error) {
      console.error("[middleware] profile lookup failed:", error.message);
    }
    cachedProfile = profile;
    return profile;
  };

  // Protected routes - require login
  const protectedPaths = ["/dashboard", "/exam", "/admin", "/teacher", "/student-hub", "/pending-approval"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user) return supabaseResponse;

  const profile = await getProfile();
  const role = profile?.role ?? "student";
  const status = profile?.status ?? "active";

  if (status === "disabled") {
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }

  // Teacher pending approval check
  if (role === "teacher" && status === "pending" && !pathname.startsWith("/pending-approval")) {
    return NextResponse.redirect(new URL("/pending-approval", request.url));
  }

  if (pathname.startsWith("/pending-approval")) {
    if (role !== "teacher") return redirectToDashboard();
    return supabaseResponse;
  }

  // /admin is admin-only
  if (pathname.startsWith("/admin")) {
    if (role !== "admin") return redirectToDashboard();
    return supabaseResponse;
  }

  // /teacher is admin or teacher
  if (pathname.startsWith("/teacher")) {
    if (role !== "teacher" && role !== "admin") return redirectToDashboard();
    return supabaseResponse;
  }

  // /student-hub is student or admin
  if (pathname.startsWith("/student-hub")) {
    if (role !== "student" && role !== "admin") return redirectToDashboard();
    return supabaseResponse;
  }

  // Students can only access assigned exam detail routes
  if (pathname.startsWith("/exam")) {
    if (role === "admin" || role === "teacher") return supabaseResponse;

    if (pathname.match(/^\/exam\/(listening|reading|writing|speaking)\/?$/)) {
      return supabaseResponse;
    }

    const match = pathname.match(/^\/exam\/(listening|reading|writing|speaking)\/(\d+)\/?$/);
    if (!match) return redirectToDashboard();

    const [, examType, rawId] = match;
    const targetId = Number(rawId);
    if (!Number.isInteger(targetId) || targetId <= 0) return redirectToDashboard();

    let query = supabase
      .from("exam_assignments")
      .select("id")
      .eq("student_email", user.email ?? "")
      .eq("exam_type", examType)
      .limit(1);

    if (examType === "listening" || examType === "reading") {
      query = query.eq("serie_id", targetId);
    } else if (examType === "writing") {
      query = query.eq("combinaison_id", targetId);
    } else {
      query = query.eq("partie_id", targetId);
    }

    const { data: assigned, error } = await query;
    if (error || !assigned || assigned.length === 0) {
      return redirectToDashboard();
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
