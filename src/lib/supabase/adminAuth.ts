import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createPrivilegedSupabase } from "@/lib/supabase/privileged";

export type AppRole = "admin" | "teacher" | "student";
export type ProfileStatus = "pending" | "active" | "disabled";

export interface AppProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  status: ProfileStatus;
}

interface AuthContext {
  db: SupabaseClient;
  user: User;
  profile: AppProfile;
}

function forbidden(message = "FORBIDDEN"): never {
  throw new Error(message);
}

export { createPrivilegedSupabase } from "@/lib/supabase/privileged";

async function getAuthenticatedContext(): Promise<AuthContext> {
  const supabase = await createClient();
  const privileged = createPrivilegedSupabase();
  const profileReader = privileged ?? (supabase as unknown as SupabaseClient);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    forbidden();
  }

  const { data: profile, error } = await profileReader
    .from("profiles")
    .select("id, email, full_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    forbidden();
  }
  return {
    db: profileReader,
    user,
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role as AppRole,
      status: (profile.status ?? "active") as ProfileStatus,
    },
  };
}

function ensureNotDisabled(profile: AppProfile) {
  if (profile.status === "disabled") {
    forbidden("DISABLED");
  }
}

export async function getCurrentUserProfile(): Promise<AuthContext> {
  const ctx = await getAuthenticatedContext();
  ensureNotDisabled(ctx.profile);
  return ctx;
}

export async function requireAdminAndDb(): Promise<AuthContext> {
  const ctx = await getCurrentUserProfile();
  if (ctx.profile.role !== "admin") {
    forbidden();
  }
  return ctx;
}

export async function requireActiveTeacherOrAdminAndDb(): Promise<AuthContext> {
  const ctx = await getCurrentUserProfile();
  if (ctx.profile.role === "admin") {
    return ctx;
  }
  if (ctx.profile.role !== "teacher") {
    forbidden();
  }
  if (ctx.profile.status !== "active") {
    forbidden(ctx.profile.status === "pending" ? "PENDING" : "FORBIDDEN");
  }
  return ctx;
}

export async function requireActiveStudentAndDb(): Promise<AuthContext> {
  const ctx = await getCurrentUserProfile();
  if (ctx.profile.role !== "student" || ctx.profile.status !== "active") {
    forbidden(ctx.profile.status === "disabled" ? "DISABLED" : "FORBIDDEN");
  }
  return ctx;
}

export async function getTeacherManagedStudentIds(db: SupabaseClient, teacherId: string): Promise<string[]> {
  const { data, error } = await db
    .from("teacher_students")
    .select("student_id")
    .eq("teacher_id", teacherId);

  if (error) {
    throw new Error(`Lỗi lấy lớp học viên: ${error.message}`);
  }

  return (data ?? []).map((row: { student_id: string }) => row.student_id);
}

export async function requireOwnedStudentResource(input: {
  studentId?: string | null;
  studentEmail?: string | null;
}): Promise<AuthContext & { studentId: string | null; studentEmail: string | null }> {
  const ctx = await requireActiveTeacherOrAdminAndDb();

  if (ctx.profile.role === "admin") {
    return {
      ...ctx,
      studentId: input.studentId ?? null,
      studentEmail: input.studentEmail ?? null,
    };
  }

  const managedIds = await getTeacherManagedStudentIds(ctx.db, ctx.user.id);
  if (managedIds.length === 0) {
    forbidden();
  }

  let resolvedStudentId = input.studentId ?? null;
  let resolvedStudentEmail = input.studentEmail ?? null;

  if (!resolvedStudentId && resolvedStudentEmail) {
    const { data: profile, error } = await ctx.db
      .from("profiles")
      .select("id")
      .eq("email", resolvedStudentEmail)
      .maybeSingle();

    if (error || !profile) {
      forbidden();
    }
    resolvedStudentId = profile.id;
  }

  if (!resolvedStudentEmail && resolvedStudentId) {
    const { data: profile, error } = await ctx.db
      .from("profiles")
      .select("email")
      .eq("id", resolvedStudentId)
      .maybeSingle();

    if (error || !profile) {
      forbidden();
    }
    resolvedStudentEmail = profile.email;
  }

  if (!resolvedStudentId || !managedIds.includes(resolvedStudentId)) {
    forbidden();
  }

  return {
    ...ctx,
    studentId: resolvedStudentId,
    studentEmail: resolvedStudentEmail,
  };
}
