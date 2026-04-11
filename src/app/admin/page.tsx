import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Users, GraduationCap, ClipboardList, FileCheck, Newspaper,
  LayoutDashboard, FileText, Inbox, Headphones, BookOpen, PenLine, Mic,
  Plus, ArrowRight,
} from 'lucide-react';

async function getDashboardStats() {
  const supabase = await createClient();

  const [
    { count: usersCount },
    { count: studentsCount },
    { count: assignmentsCount },
    { count: submissionsCount },
    { count: postsCount },
    { data: recentSubmissions },
    { data: recentAssignments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('exam_assignments').select('*', { count: 'exact', head: true }),
    supabase.from('exam_submissions').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('exam_submissions')
      .select('id, student_email, exam_type, score, submitted_at, serie_id, combinaison_id, partie_id')
      .order('submitted_at', { ascending: false })
      .limit(5),
    supabase.from('exam_assignments')
      .select('id, student_email, exam_type, exam_label, assigned_at')
      .order('assigned_at', { ascending: false })
      .limit(5),
  ]);

  return {
    usersCount: usersCount || 0,
    studentsCount: studentsCount || 0,
    assignmentsCount: assignmentsCount || 0,
    submissionsCount: submissionsCount || 0,
    postsCount: postsCount || 0,
    recentSubmissions: recentSubmissions || [],
    recentAssignments: recentAssignments || [],
  };
}

const TYPE_BADGE: Record<string, { Icon: React.ComponentType<{ className?: string }>; label: string; cls: string }> = {
  listening: { Icon: Headphones, label: 'Listening', cls: 'bg-sky-100 text-sky-700' },
  reading:   { Icon: BookOpen,   label: 'Reading',   cls: 'bg-emerald-100 text-emerald-700' },
  writing:   { Icon: PenLine,    label: 'Writing',   cls: 'bg-violet-100 text-violet-700' },
  speaking:  { Icon: Mic,        label: 'Speaking',  cls: 'bg-rose-100 text-rose-700' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function examRef(row: { exam_type: string; serie_id?: number | null; combinaison_id?: number | null; partie_id?: number | null; exam_label?: string | null }) {
  if (row.exam_label) return row.exam_label;
  if (row.exam_type === 'listening' || row.exam_type === 'reading') return `Série ${row.serie_id}`;
  if (row.exam_type === 'writing') return `Comb. ${row.combinaison_id}`;
  return `Partie ${row.partie_id}`;
}

const statCards = [
  { label: 'Tổng Users', key: 'usersCount', Icon: Users, color: 'text-gray-800', bg: 'bg-gray-50', link: '/admin/students' },
  { label: 'Học viên', key: 'studentsCount', Icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/admin/students' },
  { label: 'Bài đã gán', key: 'assignmentsCount', Icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/assignments' },
  { label: 'Bài đã nộp', key: 'submissionsCount', Icon: FileCheck, color: 'text-violet-600', bg: 'bg-violet-50', link: '/admin/submissions' },
  { label: 'Bài viết', key: 'postsCount', Icon: Newspaper, color: 'text-amber-600', bg: 'bg-amber-50', link: '/admin/posts' },
] as const;

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
        <LayoutDashboard className="w-6 h-6 text-blue-600" /> Tổng Quan Hệ Thống
      </h1>
      <p className="text-sm text-gray-500 mb-6">Miora Académie · Dashboard</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.Icon;
          const value = stats[s.key as keyof typeof stats];
          return (
            <Link key={s.label} href={s.link} className={`${s.bg} rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow group`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${s.color}`} />
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{value as number}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Two columns: Recent Submissions + Recent Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-violet-600" /> Bài nộp gần đây
            </h2>
            <Link href="/admin/submissions" className="text-xs text-blue-600 hover:underline">Xem tất cả →</Link>
          </div>
          {stats.recentSubmissions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Chưa có bài nộp nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.recentSubmissions.map((sub) => {
                const badge = TYPE_BADGE[sub.exam_type] || TYPE_BADGE.listening;
                const BadgeIcon = badge.Icon;
                return (
                  <Link key={sub.id} href={`/admin/submissions/${sub.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls} flex items-center gap-1`}>
                      <BadgeIcon className="w-3 h-3" /> {badge.label}
                    </span>
                    <span className="text-sm text-gray-700 truncate flex-1">{sub.student_email}</span>
                    <span className="text-xs font-semibold text-gray-800">
                      {sub.score !== null ? `${sub.score} pts` : examRef(sub)}
                    </span>
                    <span className="text-[10px] text-gray-400 w-20 text-right">{fmtDate(sub.submitted_at)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Assignments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" /> Bài gán gần đây
            </h2>
            <Link href="/admin/assignments" className="text-xs text-blue-600 hover:underline">Xem tất cả →</Link>
          </div>
          {stats.recentAssignments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Chưa gán bài nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.recentAssignments.map((a) => {
                const badge = TYPE_BADGE[a.exam_type] || TYPE_BADGE.listening;
                const BadgeIcon = badge.Icon;
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls} flex items-center gap-1`}>
                      <BadgeIcon className="w-3 h-3" /> {badge.label}
                    </span>
                    <span className="text-sm text-gray-700 truncate flex-1">{a.student_email}</span>
                    <span className="text-xs text-gray-500">{examRef(a)}</span>
                    <span className="text-[10px] text-gray-400 w-20 text-right">{fmtDate(a.assigned_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3">
        <Link href="/admin/assignments/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Gán bài mới
        </Link>
        <Link href="/admin/posts/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors">
          <Plus className="w-4 h-4" /> Viết bài mới
        </Link>
      </div>
    </div>
  );
}
