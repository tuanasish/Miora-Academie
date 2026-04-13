import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';

import { getTeacherAssignableStudents } from '@/app/actions/assignment.actions';
import { AssignmentForm } from '@/components/admin/AssignmentForm';

export default async function TeacherNewAssignmentPage() {
  const students = await getTeacherAssignableStudents();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/teacher/assignments"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" /> Giao Bài Mới
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-2xl">
        <AssignmentForm students={students} scope="teacher" cancelHref="/teacher/assignments" />
      </div>
    </div>
  );
}
