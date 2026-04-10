import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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

  let cachedRole: string | null | undefined;
  const getRole = async () => {
    if (cachedRole !== undefined) return cachedRole;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id ?? "")
      .maybeSingle();
    cachedRole = profile?.role ?? null;
    return cachedRole;
  };

  // Protected routes - require login
  const protectedPaths = ["/dashboard", "/exam", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and hitting /, redirect to dashboard
  if (pathname === "/" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user) return supabaseResponse;

  // /admin is admin-only
  if (pathname.startsWith("/admin")) {
    const role = await getRole();
    if (role !== "admin") return redirectToDashboard();
    return supabaseResponse;
  }

  // Students can only access assigned exam detail routes
  if (pathname.startsWith("/exam")) {
    const role = await getRole();
    if (role === "admin") return supabaseResponse;

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
