import PostForm from '@/components/admin/PostForm'
import { getPostById } from '@/app/actions/post.actions'
import { notFound } from 'next/navigation'

export default async function EditPostPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const post = await getPostById(params.id)
  
  if (!post) {
    return notFound()
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Chỉnh sửa bài viết</h1>
      <PostForm initialData={post} />
    </div>
  )
}
