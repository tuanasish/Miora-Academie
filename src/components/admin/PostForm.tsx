'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TiptapEditor from './TiptapEditor'
import ThumbnailUpload from './ThumbnailUpload'
import { createPost, updatePost } from '@/app/actions/post.actions'
import { Post, CreatePostDTO } from '@/lib/types/post'

export default function PostForm({ initialData }: { initialData?: Post }) {
  const router = useRouter()
  const isEdit = !!initialData
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreatePostDTO>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    excerpt: initialData?.excerpt || '',
    content: initialData?.content || '',
    thumbnail_url: initialData?.thumbnail_url || '',
    status: initialData?.status || 'draft'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit && initialData) {
        await updatePost(initialData.id, form)
      } else {
        await createPost(form)
      }
      router.push('/admin/posts')
      router.refresh()
    } catch (e: any) {
      alert("Lỗi: " + e.message)
      setLoading(false)
    }
  }

  // Tiếng Việt xịn xò slug
  const removeVietnameseTones = (str: string) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
  }

  const handleTitleChange = (val: string) => {
    if (!isEdit) {
      const slug = removeVietnameseTones(val)
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      setForm({ ...form, title: val, slug })
    } else {
      setForm({ ...form, title: val })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề bài viết <span className="text-red-500">*</span></label>
          <input required type="text" className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Nhập tiêu đề..." value={form.title} onChange={e => handleTitleChange(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Đường dẫn tĩnh (Slug) <span className="text-red-500">*</span></label>
          <input required type="text" className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tóm tắt ngắn (Excerpt)</label>
            <textarea rows={3} className="w-full text-gray-900 placeholder:text-gray-400 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mô tả sẽ hiện ngoài trang chủ..." value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung bài viết</label>
            <TiptapEditor content={form.content || ''} onChange={(html) => setForm({ ...form, content: html })} />
          </div>
        </div>

        <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-100 h-fit">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái xuất bản</label>
            <select className="w-full text-gray-900 border border-gray-300 p-3 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
              <option value="draft">Bản nháp (Ẩn)</option>
              <option value="published">Xuất bản (Hiển thị ngay)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh bìa (Thumbnail)</label>
            <ThumbnailUpload url={form.thumbnail_url || null} onUpload={(url) => setForm({ ...form, thumbnail_url: url })} />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-4 pt-6 flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-gray-700 font-medium border border-gray-300 hover:bg-gray-100 transition-colors">Hủy / Quay lại</button>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Đang lưu...' : 'Lưu bài viết'}
        </button>
      </div>
    </form>
  )
}
