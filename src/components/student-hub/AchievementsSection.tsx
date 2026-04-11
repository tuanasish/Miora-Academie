import { Trophy, Award } from 'lucide-react';
import type { Achievement } from '@/lib/types/student-hub';

interface AchievementsSectionProps {
  achievements: Achievement[];
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  return (
    <section id="achievements" className="bg-[#f3efe6] py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7c9b8] bg-white px-4 py-1.5 text-sm font-bold text-[#d4a017]">
            <Trophy className="h-4 w-4" />
            Vinh danh
          </div>
          <h2 className="text-3xl font-extrabold text-[#121212] lg:text-4xl">
            Thành Tựu{' '}
            <span className="text-[#f05e23]">Học Viên</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[#5d5d5d]">
            Niềm tự hào của Miora – những bạn học viên đã chinh phục thành công các kỳ thi tiếng Pháp.
          </p>
        </div>

        {/* Achievements Grid */}
        {achievements.length === 0 ? (
          <div className="mt-10 rounded-[16px] border-2 border-dashed border-[#d7c9b8] bg-white py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-[#d7c9b8]" />
            <p className="mt-3 text-[#5d5d5d] font-medium">Bảng vàng đang được cập nhật!</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, idx) => (
              <div
                key={achievement.id}
                className="group relative overflow-hidden rounded-[16px] border border-[#e4ddd1] bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Gold ribbon corner */}
                <div className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-gradient-to-br from-[#d4a017] to-[#f0c040]" />
                <div className="absolute right-2 top-2">
                  <Award className="h-4 w-4 text-white" />
                </div>

                {/* Avatar + Name */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a017] to-[#f0c040] text-white text-xl font-bold shadow-sm">
                    {achievement.avatar_url ? (
                      <img
                        src={achievement.avatar_url}
                        alt={achievement.student_name}
                        className="h-full w-full rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      achievement.student_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#121212]">{achievement.student_name}</h3>
                    {achievement.year && (
                      <span className="text-xs font-semibold text-[#999]">Năm {achievement.year}</span>
                    )}
                  </div>
                </div>

                {/* Achievement */}
                <div className="mt-4 rounded-[12px] bg-[#f3efe6] px-4 py-3 border border-[#e4ddd1]">
                  <p className="text-lg font-extrabold text-[#d4a017]">
                    🏆 {achievement.achievement}
                  </p>
                </div>

                {/* Description */}
                {achievement.description && (
                  <p className="mt-3 text-sm text-[#5d5d5d] leading-relaxed">
                    {achievement.description}
                  </p>
                )}

                {/* Rank number */}
                <div className="absolute bottom-3 right-4 text-5xl font-black text-[#f3efe6] select-none">
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
