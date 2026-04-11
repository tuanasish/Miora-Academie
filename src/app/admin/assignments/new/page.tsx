import Link from 'next/link';
import { getStudents } from '@/app/actions/assignment.actions';
import { AssignmentForm } from '@/components/admin/AssignmentForm';

export default async function NewAssignmentPage() {
  const students = await getStudents();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/assignments"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          ← Quay lại
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-2xl font-bold text-gray-800">📋 Gán Bài Mới</h1>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-2xl">
        <AssignmentForm students={students} />
      </div>
    </div>
  );
}
