'use client';

interface StatusSelectProps {
  userId: string;
  currentStatus: string;
  action: (formData: FormData) => void;
}

export function StatusSelect({ userId, currentStatus, action }: StatusSelectProps) {
  const getColors = (status: string) => {
    switch(status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'disabled': return 'bg-gray-200 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <form action={action}>
      <input type="hidden" name="id" value={userId} />
      <select
        name="status"
        defaultValue={currentStatus}
        onChange={(e) => {
          const form = e.currentTarget.closest('form');
          if (form) form.requestSubmit();
        }}
        className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer focus:ring-2 focus:ring-blue-300 ${getColors(currentStatus)}`}
      >
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="disabled">Disabled</option>
      </select>
    </form>
  );
}
