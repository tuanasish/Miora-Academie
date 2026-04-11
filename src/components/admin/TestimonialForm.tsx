'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTestimonial, updateTestimonial } from '@/app/actions/testimonial.actions';
import type { Testimonial, CreateTestimonialDTO } from '@/lib/types/student-hub';

export default function TestimonialForm({ initialData }: { initialData?: Testimonial }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateTestimonialDTO>({
    student_name: initialData?.student_name || '',
    avatar_url: initialData?.avatar_url || '',
    course: initialData?.course || '',
    quote: initialData?.quote || '',
    rating: initialData?.rating ?? 5,
    is_active: initialData?.is_active ?? true,
    display_order: initialData?.display_order ?? 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && initialData) {
        await updateTestimonial(initialData.id, form);
      } else {
        await createTestimonial(form);
      }
      router.push('/admin/testimonials');
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
          <input required type="text" className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: Nguyễn Minh Anh" value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Khóa học</label>
          <input type="text" className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: DELF B1" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Trích dẫn feedback <span className="text-red-500">*</span></label>
        <textarea required rows={4} className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập nội dung cảm nhận của học viên..." value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">URL ảnh đại diện</label>
        <input type="url" className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Đánh giá</label>
          <select className="w-full text-gray-900 border border-gray-300 p-3 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" value={form.rating} onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}>
            <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
            <option value={4}>⭐⭐⭐⭐ (4)</option>
            <option value={3}>⭐⭐⭐ (3)</option>
            <option value={2}>⭐⭐ (2)</option>
            <option value={1}>⭐ (1)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Thứ tự</label>
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
          {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm feedback'}
        </button>
      </div>
    </form>
  );
}
