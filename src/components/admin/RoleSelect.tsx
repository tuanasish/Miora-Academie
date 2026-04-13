'use client';

interface RoleSelectProps {
  userId: string;
  currentRole: string;
  action: (formData: FormData) => void;
}

export function RoleSelect({ userId, currentRole, action }: RoleSelectProps) {
  const getColors = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-blue-100 text-blue-700';
      case 'teacher': return 'bg-purple-100 text-purple-700';
      case 'student': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <form action={action}>
      <input type="hidden" name="id" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        onChange={(e) => {
          const form = e.currentTarget.closest('form');
          if (form) form.requestSubmit();
        }}
        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-300 ${getColors(currentRole)}`}
      >
        <option value="admin">Admin</option>
        <option value="teacher">Giáo viên</option>
        <option value="student">Học viên</option>
      </select>
    </form>
  );
}
