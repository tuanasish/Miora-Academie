'use client'

import { useState } from 'react'
import { uploadBlogImage } from '@/app/actions/post.actions'

export default function ThumbnailUpload({ 
  url, 
  onUpload 
}: { 
  url: string | null, 
  onUpload: (url: string) => void 
}) {
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', e.target.files[0])
      const newUrl = await uploadBlogImage(formData)
      onUpload(newUrl)
    } catch (err: any) {
      alert("Lỗi tải ảnh: " + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mt-2">
      {url ? (
        <div className="relative inline-block border rounded">
          <img src={url} alt="Thumbnail" className="h-40 w-auto object-contain rounded" />
          <button type="button" onClick={() => onUpload('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-red-600">×</button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 h-40 w-full md:w-64 rounded-lg cursor-pointer hover:bg-gray-100 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isUploading ? (
            <span className="text-gray-500 font-medium">Đang tải lên...</span>
          ) : (
            <>
              <span className="text-4xl mb-2">📸</span>
              <span className="text-blue-600 font-medium">Bấm để tải ảnh bìa</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}
    </div>
  )
}
