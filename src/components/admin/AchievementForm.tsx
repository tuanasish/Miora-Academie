'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAchievement, updateAchievement } from '@/app/actions/achievement.actions';
import type { Achievement, CreateAchievementDTO } from '@/lib/types/student-hub';

export default function AchievementForm({ initialData }: { initialData?: Achievement }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateAchievementDTO>({
    student_name: initialData?.student_name || '',
    avatar_url: initialData?.avatar_url || '',
    achievement: initialData?.achievement || '',
    description: initialData?.description || '',
    year: initialData?.year || new Date().getFullYear().toString(),
    is_active: initialData?.is_active ?? true,
    display_order: initialData?.display_order ?? 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && initialData) {
        await updateAchievement(initialData.id, form);
      } else {
        await createAchievement(form);
      }
      router.push('/admin/achievements');
      router.refresh();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tên học viên <span className="text-red-500">*</span></label>
          <input required type="text" className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: Trần Đức Huy" value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Năm đạt được</label>
          <input type="text" className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: 2026" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Thành tích <span className="text-red-500">*</span></label>
        <input required type="text" className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: DELF B2 - 85/100" value={form.achievement} onChange={e => setForm({ ...form, achievement: e.target.value })} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả chi tiết</label>
        <textarea rows={3} className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Câu chuyện thành công của học viên..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">URL ảnh đại diện</label>
        <input type="url" className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Thứ tự hiển thị</label>
          <input type="number" min={0} className="w-full text-gray-900 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Hiển thị</label>
          <select className="w-full text-gray-900 border border-gray-300 p-3 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" value={form.is_active ? 'true' : 'false'} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
            <option value="true">✅ Hiển thị</option>
            <option value="false">⛔ Ẩn</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-2 pt-6 flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-gray-700 font-medium border border-gray-300 hover:bg-gray-100 transition-colors">Hủy</button>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm thành tựu'}
        </button>
      </div>
    </form>
  );
}
