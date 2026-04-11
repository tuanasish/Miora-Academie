import { getResourceById } from '@/app/actions/resource.actions';
import ResourceForm from '@/components/admin/ResourceForm';
import { notFound } from 'next/navigation';

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await getResourceById(id);
  if (!resource) notFound();

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Sửa tài liệu</h1>
      <ResourceForm initialData={resource} />
    </div>
  );
}
