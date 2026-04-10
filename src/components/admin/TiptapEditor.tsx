'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { uploadBlogImage } from '@/app/actions/post.actions'
import { useState } from 'react'

export default function TiptapEditor({ 
  content, 
  onChange 
}: { 
  content: string, 
  onChange: (html: string) => void 
}) {
  const [isUploading, setIsUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg mx-auto focus:outline-none p-4 min-h-[300px] text-gray-900',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
  })

  const uploadImage = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const url = await uploadBlogImage(formData)
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    } catch (e) {
      alert("Lỗi tải ảnh lên")
    } finally {
      setIsUploading(false)
    }
  }

  if (!editor) return null

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Menu Bar */}
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex gap-2 flex-wrap items-center text-sm font-medium text-gray-700">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-1.5 rounded ${editor.isActive('bold') ? 'bg-gray-300 text-black' : 'hover:bg-gray-200'}`}>In đậm</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-1.5 rounded ${editor.isActive('italic') ? 'bg-gray-300 text-black' : 'hover:bg-gray-200'}`}>In nghiêng</button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-3 py-1.5 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 text-black' : 'hover:bg-gray-200'}`}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-3 py-1.5 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 text-black' : 'hover:bg-gray-200'}`}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-3 py-1.5 rounded ${editor.isActive('bulletList') ? 'bg-gray-300 text-black' : 'hover:bg-gray-200'}`}>List (•)</button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <label className={`px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
          {isUploading ? 'Đang up...' : '🖼️ Chèn Hình'}
          <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              uploadImage(e.target.files[0])
            }
          }} />
        </label>
      </div>

      <EditorContent editor={editor} className="bg-white" />
    </div>
  )
}
