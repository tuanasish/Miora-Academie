'use client';

import { Trash2 } from 'lucide-react';

export default function DeleteAssignmentButton() {
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 transition-colors hover:text-red-700"
      onClick={(event) => {
        if (!window.confirm('Xóa assignment này?')) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="h-3 w-3" />
      Xóa
    </button>
  );
}
