'use client';

interface RoleSelectProps {
  studentId: string;
  currentRole: string;
  action: (formData: FormData) => void;
}

export function RoleSelect({ studentId, currentRole, action }: RoleSelectProps) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={studentId} />
      <select
        name="role"
        defaultValue={currentRole}
        onChange={(e) => {
          const form = e.currentTarget.closest('form');
          if (form) form.requestSubmit();
        }}
        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-300 ${
          currentRole === 'admin'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        <option value="admin">Admin</option>
        <option value="student">Học viên</option>
      </select>
    </form>
  );
}
