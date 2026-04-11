import Link from 'next/link';
import { getStudents } from '@/app/actions/assignment.actions';
import { AssignmentForm } from '@/components/admin/AssignmentForm';
import { ArrowLeft, ClipboardList } from 'lucide-react';

export default async function NewAssignmentPage() {
  const students = await getStudents();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/assignments"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" /> Gán Bài Mới
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-2xl">
        <AssignmentForm students={students} />
      </div>
    </div>
  );
}
