'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, UserPlus, X, SquarePen } from 'lucide-react';

import {
  assignStudentToTeacher,
  removeStudentFromTeacher,
  getAssignedStudents,
} from '@/app/actions/user.actions';

interface StudentData {
  id: string;
  email: string;
  full_name: string | null;
}

interface TeacherRowProps {
  teacherId: string;
  teacherEmail: string;
  teacherName: string | null;
  teacherStatus: string;
  studentsCount: number;
  allStudents: StudentData[];
  RoleSelectComponent: React.ReactNode;
  StatusSelectComponent: React.ReactNode;
}

export function TeacherRow({
  teacherId,
  teacherEmail,
  teacherName,
  studentsCount,
  teacherStatus,
  allStudents,
  RoleSelectComponent,
  StatusSelectComponent,
}: TeacherRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExpandToggle = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    setLoading(true);
    try {
      const ids = await getAssignedStudents(teacherId);
      setAssignedIds(ids);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAssign = async (studentId: string, isAssigned: boolean) => {
    if (isAssigned) {
      setAssignedIds((prev) => prev.filter((id) => id !== studentId));
      await removeStudentFromTeacher(teacherId, studentId);
    } else {
      setAssignedIds((prev) => [...prev, studentId]);
      await assignStudentToTeacher(teacherId, studentId);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleExpandToggle()}
              className="p-1 hover:bg-gray-200 rounded text-gray-500"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <div>
              <p className="text-sm font-medium text-gray-800">{teacherEmail}</p>
              {teacherName && <p className="text-xs text-gray-400 mt-0.5">{teacherName}</p>}
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <p className="text-sm text-gray-600">{teacherName || '—'}</p>
        </td>
        <td className="px-4 py-4">{RoleSelectComponent}</td>
        <td className="px-4 py-4 text-center">
          <span className={`text-sm font-semibold ${studentsCount > 0 ? 'text-purple-600' : 'text-gray-300'}`}>
            {studentsCount} hv
          </span>
        </td>
        <td className="px-4 py-4 text-center">{StatusSelectComponent}</td>
        <td className="px-4 py-4 text-right">
          <Link
            href={`/admin/users/${teacherId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <SquarePen className="w-3.5 h-3.5" />
            Chỉnh sửa
          </Link>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-purple-50">
          <td colSpan={6} className="px-10 py-4 border-b border-gray-200">
            <div className="text-sm text-gray-800 font-semibold mb-2 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-600" /> Phân công học viên cho lớp này:
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Trạng thái hiện tại: {teacherStatus === 'active' ? 'Active' : teacherStatus === 'pending' ? 'Pending' : 'Disabled'}
            </p>
            {loading ? (
              <p className="text-xs text-gray-500">Đang tải...</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded border border-gray-200">
                {allStudents.map((student) => {
                  const isAssigned = assignedIds.includes(student.id);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => void handleToggleAssign(student.id, isAssigned)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                        isAssigned
                          ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200'
                      }`}
                    >
                      {student.full_name || student.email}
                      {isAssigned && <X className="w-3 h-3 ml-1" />}
                    </button>
                  );
                })}
                {allStudents.length === 0 && (
                  <p className="text-xs text-gray-500">Chưa có học viên nào trong hệ thống.</p>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
