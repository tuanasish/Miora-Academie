'use server';

import { revalidatePath } from 'next/cache';

import { logAuditEventSafely } from '@/lib/audit';
import { createPrivilegedSupabase, requireAdminAndDb } from '@/lib/supabase/adminAuth';

export type UserRole = 'admin' | 'teacher' | 'student';
export type UserStatus = 'pending' | 'active' | 'disabled';

export interface UserWithStats {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  assignments_count: number;
  submissions_count: number;
  students_count?: number;
}

export interface UserEditInput {
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function defaultStatusForRole(role: UserRole): UserStatus {
  return role === 'teacher' ? 'pending' : 'active';
}

async function ensureStudentStreak(db: NonNullable<ReturnType<typeof createPrivilegedSupabase>>, studentId: string) {
  const { data } = await db.from('streaks').select('student_id').eq('student_id', studentId).maybeSingle();
  if (!data) {
    await db.from('streaks').insert({
      student_id: studentId,
      current_streak: 0,
      highest_streak: 0,
    });
  }
}

function revalidateUserAdminViews() {
  revalidatePath('/admin');
  revalidatePath('/admin/audit-logs');
  revalidatePath('/admin/users');
  revalidatePath('/admin/assignments');
  revalidatePath('/teacher/students');
}

function buildAuditActor(ctx: Awaited<ReturnType<typeof requireAdminAndDb>>) {
  return {
    actorId: ctx.user.id,
    actorEmail: ctx.profile.email,
    actorName: ctx.profile.full_name,
    actorRole: ctx.profile.role,
  };
}

export async function getUsersList(): Promise<UserWithStats[]> {
  const { db } = await requireAdminAndDb();

  const [profilesRes, assignmentRes, submissionRes, classRes] = await Promise.all([
    db.from('profiles').select('*').order('created_at', { ascending: false }),
    db.from('exam_assignments').select('student_email'),
    db.from('exam_submissions').select('student_email'),
    db.from('teacher_students').select('teacher_id, student_id'),
  ]);

  if (profilesRes.error) {
    throw new Error(`Lỗi lấy danh sách: ${profilesRes.error.message}`);
  }

  const assignMap = new Map<string, number>();
  (assignmentRes.data ?? []).forEach((row: { student_email: string }) => {
    const email = row.student_email;
    assignMap.set(email, (assignMap.get(email) ?? 0) + 1);
  });

  const submitMap = new Map<string, number>();
  (submissionRes.data ?? []).forEach((row: { student_email: string }) => {
    const email = row.student_email;
    submitMap.set(email, (submitMap.get(email) ?? 0) + 1);
  });

  const classMap = new Map<string, number>();
  (classRes.data ?? []).forEach((row: { teacher_id: string }) => {
    classMap.set(row.teacher_id, (classMap.get(row.teacher_id) ?? 0) + 1);
  });

  return (profilesRes.data ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role as UserRole,
    status: (profile.status ?? 'active') as UserStatus,
    created_at: profile.created_at,
    assignments_count: assignMap.get(profile.email) ?? 0,
    submissions_count: submitMap.get(profile.email) ?? 0,
    students_count: classMap.get(profile.id) ?? 0,
  }));
}

export async function getUserById(id: string): Promise<UserWithStats | null> {
  const users = await getUsersList();
  return users.find((user) => user.id === id) ?? null;
}

export async function createUserAccount(input: {
  email: string;
  full_name: string;
  role: UserRole;
}): Promise<void> {
  const ctx = await requireAdminAndDb();
  const { db } = ctx;
  const email = normalizeEmail(input.email);
  const fullName = input.full_name.trim();
  if (!email || !fullName) {
    throw new Error('Tên và email là bắt buộc.');
  }

  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: input.role,
    },
  });

  if (error) {
    throw new Error(`Lỗi tạo tài khoản: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Lỗi tạo tài khoản: user không được tạo.');
  }

  const status = defaultStatusForRole(input.role);
  const { error: profileError } = await db
    .from('profiles')
    .update({
      email,
      full_name: fullName,
      role: input.role,
      status,
    })
    .eq('id', data.user.id);

  if (profileError) {
    throw new Error(`Lỗi đồng bộ profile: ${profileError.message}`);
  }

  if (input.role === 'student') {
    await ensureStudentStreak(db as NonNullable<ReturnType<typeof createPrivilegedSupabase>>, data.user.id);
  }

  await logAuditEventSafely(db, {
    ...buildAuditActor(ctx),
    action: 'user.create',
    targetType: 'profile',
    targetId: data.user.id,
    targetLabel: email,
    metadata: {
      role: input.role,
      status,
      full_name: fullName,
    },
  });

  revalidateUserAdminViews();
}

export async function updateUserProfile(id: string, input: UserEditInput): Promise<void> {
  const ctx = await requireAdminAndDb();
  const { db } = ctx;
  const email = normalizeEmail(input.email);
  const fullName = input.full_name?.trim() || null;
  if (!email) {
    throw new Error('Email không hợp lệ.');
  }

  const { data: beforeProfile, error: beforeError } = await db
    .from('profiles')
    .select('id, email, full_name, role, status')
    .eq('id', id)
    .maybeSingle();

  if (beforeError || !beforeProfile) {
    throw new Error(`Không tìm thấy người dùng cần cập nhật: ${beforeError?.message ?? 'NOT_FOUND'}`);
  }

  const { error: authError } = await db.auth.admin.updateUserById(id, {
    email,
    user_metadata: {
      full_name: fullName,
      role: input.role,
    },
  });

  if (authError) {
    throw new Error(`Lỗi cập nhật auth user: ${authError.message}`);
  }

  const { error: profileError } = await db
    .from('profiles')
    .update({
      email,
      full_name: fullName,
      role: input.role,
      status: input.status,
    })
    .eq('id', id);

  if (profileError) {
    throw new Error(`Lỗi cập nhật profile: ${profileError.message}`);
  }

  if (input.role === 'student') {
    await ensureStudentStreak(db as NonNullable<ReturnType<typeof createPrivilegedSupabase>>, id);
  }

  await logAuditEventSafely(db, {
    ...buildAuditActor(ctx),
    action: 'user.update',
    targetType: 'profile',
    targetId: id,
    targetLabel: email,
    metadata: {
      before: {
        email: beforeProfile.email,
        full_name: beforeProfile.full_name,
        role: beforeProfile.role,
        status: beforeProfile.status ?? 'active',
      },
      after: {
        email,
        full_name: fullName,
        role: input.role,
        status: input.status,
      },
    },
  });

  revalidateUserAdminViews();
  revalidatePath(`/admin/users/${id}`);
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  const user = await getUserById(id);
  if (!user) throw new Error('Không tìm thấy người dùng.');

  const nextStatus =
    role === 'teacher'
      ? user.role !== 'teacher' && user.status === 'active'
        ? 'pending'
        : user.status
      : user.status === 'pending'
        ? 'active'
        : user.status;

  await updateUserProfile(id, {
    email: user.email,
    full_name: user.full_name,
    role,
    status: nextStatus,
  });
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<void> {
  const user = await getUserById(id);
  if (!user) throw new Error('Không tìm thấy người dùng.');

  await updateUserProfile(id, {
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    status,
  });
}

export async function deactivateUser(id: string): Promise<void> {
  await updateUserStatus(id, 'disabled');
}

export async function hardDeleteUser(id: string): Promise<void> {
  const ctx = await requireAdminAndDb();
  const { db } = ctx;

  const { data: beforeProfile } = await db
    .from('profiles')
    .select('email, full_name, role')
    .eq('id', id)
    .maybeSingle();

  const { error: authError } = await db.auth.admin.deleteUser(id);
  if (authError) {
    throw new Error(`Lỗi xóa user từ hệ thống Auth: ${authError.message}`);
  }

  // Thử xóa profile phòng trường hợp FK không có ON DELETE CASCADE
  await db.from('profiles').delete().eq('id', id);
  // (Thực tế nếu `db.auth.admin.deleteUser` chặn do Foreign Key constraint, nó sẽ ném lỗi ngay dòng trên)

  await logAuditEventSafely(db, {
    ...buildAuditActor(ctx),
    action: 'user.hard_delete',
    targetType: 'profile',
    targetId: id,
    targetLabel: beforeProfile?.email || id,
    metadata: {
      deleted_role: beforeProfile?.role,
      deleted_name: beforeProfile?.full_name,
    },
  });

  revalidateUserAdminViews();
}

async function validateTeacherStudentPair(db: NonNullable<ReturnType<typeof createPrivilegedSupabase>>, teacherId: string, studentId: string) {
  const { data: profiles, error } = await db
    .from('profiles')
    .select('id, role')
    .in('id', [teacherId, studentId]);

  if (error) {
    throw new Error(`Lỗi kiểm tra phân công: ${error.message}`);
  }

  const teacher = profiles?.find((profile) => profile.id === teacherId);
  const student = profiles?.find((profile) => profile.id === studentId);
  if (!teacher || teacher.role !== 'teacher') {
    throw new Error('Tài khoản được chọn không phải giáo viên.');
  }
  if (!student || student.role !== 'student') {
    throw new Error('Tài khoản được chọn không phải học viên.');
  }
}

export async function assignStudentToTeacher(teacher_id: string, student_id: string): Promise<void> {
  const ctx = await requireAdminAndDb();
  const { db } = ctx;
  await validateTeacherStudentPair(
    db as NonNullable<ReturnType<typeof createPrivilegedSupabase>>,
    teacher_id,
    student_id,
  );

  const { error } = await db.from('teacher_students').upsert(
    [{ teacher_id, student_id }],
    { onConflict: 'teacher_id,student_id' },
  );

  if (error) throw new Error(`Lỗi gán học viên: ${error.message}`);

  await logAuditEventSafely(db, {
    ...buildAuditActor(ctx),
    action: 'teacher_student.assign',
    targetType: 'teacher_student',
    targetLabel: `${teacher_id} -> ${student_id}`,
    metadata: {
      teacher_id,
      student_id,
    },
  });

  revalidateUserAdminViews();
}

export async function removeStudentFromTeacher(teacher_id: string, student_id: string): Promise<void> {
  const ctx = await requireAdminAndDb();
  const { db } = ctx;
  const { error } = await db
    .from('teacher_students')
    .delete()
    .eq('teacher_id', teacher_id)
    .eq('student_id', student_id);

  if (error) throw new Error(`Lỗi xóa học viên: ${error.message}`);

  await logAuditEventSafely(db, {
    ...buildAuditActor(ctx),
    action: 'teacher_student.remove',
    targetType: 'teacher_student',
    targetLabel: `${teacher_id} -> ${student_id}`,
    metadata: {
      teacher_id,
      student_id,
    },
  });

  revalidateUserAdminViews();
}

export async function getAssignedStudents(teacher_id: string): Promise<string[]> {
  const { db } = await requireAdminAndDb();
  const { data, error } = await db
    .from('teacher_students')
    .select('student_id')
    .eq('teacher_id', teacher_id);

  if (error) throw new Error(`Lỗi khi lấy học viên đã gán: ${error.message}`);
  return (data ?? []).map((row: { student_id: string }) => row.student_id);
}
