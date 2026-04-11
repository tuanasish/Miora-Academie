'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createResource, updateResource, uploadResourceFile } from '@/app/actions/resource.actions';
import type { Resource, CreateResourceDTO, FileType } from '@/lib/types/student-hub';

export default function ResourceForm({ initialData }: { initialData?: Resource }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<CreateResourceDTO>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    file_url: initialData?.file_url || '',
    file_type: initialData?.file_type || 'pdf',
    file_size: initialData?.file_size || '',
    is_active: initialData?.is_active ?? true,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const url = await uploadResourceFile(formData);
      
      // Auto-detect file type
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let fileType: FileType = 'other';
      if (['pdf'].includes(ext)) fileType = 'pdf';
      else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) fileType = 'audio';
      else if (['doc', 'docx'].includes(ext)) fileType = 'doc';

      // Calculate size
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = parseFloat(sizeMB) < 1 
        ? `${(file.size / 1024).toFixed(0)} KB` 
        : `${sizeMB} MB`;

      setForm({ ...form, file_url: url, file_type: fileType, file_size: sizeStr });
    } catch (err: any) {
      alert('Lỗi upload: ' + err.message);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file_url) {
      alert('Vui lòng tải file lên trước!');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && initialData) {
        await updateResource(initialData.id, form);
      } else {
        await createResource(form);
      }
      router.push('/admin/resources');
      router.refresh();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6 max-w-2xl">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề tài liệu <span className="text-red-500">*</span></label>
        <input required type="text" className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: Bài tập ngữ pháp A1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả ngắn</label>
        <textarea rows={2} className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mô tả nội dung tài liệu..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">File tài liệu <span className="text-red-500">*</span></label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
          {form.file_url ? (
            <div className="space-y-2">
              <span className="text-green-600 font-semibold">✅ File đã upload</span>
              <p className="text-sm text-gray-500 break-all">{form.file_url}</p>
              <label className="inline-block mt-2 cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                Đổi file khác
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.mp3,.wav,.ogg,.zip" onChange={handleFileUpload} />
              </label>
            </div>
          ) : (
            <label className="cursor-pointer">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-500 font-medium">{uploading ? 'Đang tải lên...' : 'Nhấn để chọn file'}</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, MP3, WAV, ZIP (tối đa 50MB)</p>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.mp3,.wav,.ogg,.zip" onChange={handleFileUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Loại file</label>
          <select className="w-full text-gray-900 border border-gray-300 p-3 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" value={form.file_type} onChange={e => setForm({ ...form, file_type: e.target.value as FileType })}>
            <option value="pdf">📄 PDF</option>
            <option value="audio">🎵 Audio</option>
            <option value="doc">📝 Document</option>
            <option value="other">📎 Khác</option>
          </select>
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
        <button type="submit" disabled={loading || uploading} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm tài liệu'}
        </button>
      </div>
    </form>
  );
}
