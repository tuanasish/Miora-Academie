'use client';

import { Flame, Trophy, Calendar } from 'lucide-react';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  lastActivity: string | null;
  teacherName?: string | null;
  teacherEmail?: string | null;
}

export function StreakWidget({ currentStreak, longestStreak, lastActivity, teacherName, teacherEmail }: StreakWidgetProps) {
  const fmtDate = (iso: string | null) => {
    if (!iso) return 'Chưa có hoạt động';
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Streak emoji based on count
  const streakEmoji = currentStreak >= 30 ? '🔥🔥🔥' : currentStreak >= 7 ? '🔥🔥' : currentStreak >= 1 ? '🔥' : '❄️';
  const streakColor = currentStreak >= 7 ? 'text-orange-500' : currentStreak >= 1 ? 'text-amber-500' : 'text-gray-400';
  const streakBg = currentStreak >= 7 ? 'from-orange-50 to-amber-50 border-orange-200' : currentStreak >= 1 ? 'from-amber-50 to-yellow-50 border-amber-200' : 'from-gray-50 to-gray-100 border-gray-200';

  return (
    <div className={`bg-gradient-to-br ${streakBg} rounded-2xl border p-5 transition-all`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Chuỗi ngày học</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold ${streakColor} font-display`}>
              {currentStreak}
            </span>
            <span className="text-lg">{streakEmoji}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">ngày liên tục</p>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className="flex items-center gap-1.5 bg-white/70 rounded-lg px-2.5 py-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-gray-700">Kỷ lục: {longestStreak}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/70 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[11px] text-gray-500">{fmtDate(lastActivity)}</span>
          </div>
        </div>
      </div>

      {/* Streak encouragement */}
      {currentStreak > 0 && currentStreak < 7 && (
        <p className="mt-3 text-xs text-amber-600 bg-amber-100/50 rounded-lg px-3 py-1.5 font-medium">
          💪 Còn {7 - currentStreak} ngày nữa là đạt 1 tuần liên tục!
        </p>
      )}
      {currentStreak >= 7 && currentStreak < 30 && (
        <p className="mt-3 text-xs text-orange-600 bg-orange-100/50 rounded-lg px-3 py-1.5 font-medium">
          🎉 Tuyệt vời! Đã {currentStreak} ngày. Còn {30 - currentStreak} ngày nữa để đạt mốc 1 tháng!
        </p>
      )}
      {currentStreak >= 30 && (
        <p className="mt-3 text-xs text-red-600 bg-red-100/50 rounded-lg px-3 py-1.5 font-medium">
          🏆 Huyền thoại! {currentStreak} ngày liên tục học không nghỉ!
        </p>
      )}

      {/* Teacher info */}
      {teacherEmail && (
        <div className="mt-3 pt-3 border-t border-white/50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Giáo viên phụ trách</p>
          <p className="text-xs font-semibold text-gray-700">
            {teacherName || teacherEmail}
          </p>
        </div>
      )}
    </div>
  );
}
