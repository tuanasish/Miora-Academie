import { getAchievementById } from '@/app/actions/achievement.actions';
import AchievementForm from '@/components/admin/AchievementForm';
import { notFound } from 'next/navigation';

export default async function EditAchievementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const achievement = await getAchievementById(id);
  if (!achievement) notFound();

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Sửa thành tựu</h1>
      <AchievementForm initialData={achievement} />
    </div>
  );
}
