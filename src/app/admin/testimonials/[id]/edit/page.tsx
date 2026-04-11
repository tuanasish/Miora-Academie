import { getTestimonialById } from '@/app/actions/testimonial.actions';
import TestimonialForm from '@/components/admin/TestimonialForm';
import { notFound } from 'next/navigation';

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const testimonial = await getTestimonialById(id);
  if (!testimonial) notFound();

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Sửa feedback</h1>
      <TestimonialForm initialData={testimonial} />
    </div>
  );
}
