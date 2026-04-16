import Link from 'next/link';
import { Headphones, BookOpen, PenLine, Mic, Library, ArrowRight } from 'lucide-react';

const MODULES = [
  {
    type: 'listening',
    label: 'Compréhension Orale',
    sublabel: 'Listening',
    Icon: Headphones,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    stats: '40 séries · 39 questions/série',
    total: '1 560 questions',
    href: '/teacher/exams/listening',
    practiceHref: '/exam/listening',
  },
  {
    type: 'reading',
    label: 'Compréhension Écrite',
    sublabel: 'Reading',
    Icon: BookOpen,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    stats: '40 séries · 39 questions/série',
    total: '1 560 questions',
    href: '/teacher/exams/reading',
    practiceHref: '/exam/reading',
  },
  {
    type: 'writing',
    label: 'Expression Écrite',
    sublabel: 'Writing',
    Icon: PenLine,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    stats: '320 combinaisons · 3 tâches chacune',
    total: '960 sujets + corrections',
    href: '/teacher/exams/writing',
    practiceHref: '/exam/writing',
  },
  {
    type: 'speaking',
    label: 'Expression Orale',
    sublabel: 'Speaking',
    Icon: Mic,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    stats: '38 mois · 314 parties',
    total: '600+ sujets + corrections',
    href: '/teacher/exams/speaking',
    practiceHref: '/exam/speaking',
  },
];

export default function TeacherExamsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Library className="w-6 h-6 text-blue-600" /> Ngân Hàng Đề Thi
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem tất cả bài thi, đáp án, bài mẫu và gợi ý trả lời
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Giáo viên có thể mở trực tiếp giao diện luyện thi từ từng module bên dưới.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">3 120</p>
          <p className="text-xs text-gray-500 mt-1">Câu hỏi trắc nghiệm</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">320</p>
          <p className="text-xs text-gray-500 mt-1">Đề Writing</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">314</p>
          <p className="text-xs text-gray-500 mt-1">Parties Speaking</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">9.2 MB</p>
          <p className="text-xs text-gray-500 mt-1">Tổng dữ liệu</p>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MODULES.map((m) => {
          const Icon = m.Icon;
          return (
            <div
              key={m.type}
              className={`group bg-white rounded-2xl border-2 ${m.border} p-6 hover:shadow-lg transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${m.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg">{m.label}</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">{m.sublabel}</p>
                  <p className="text-sm text-gray-600 mt-2">{m.stats}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs font-bold ${m.color} ${m.bg} px-2.5 py-1 rounded-full`}>
                      {m.total}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">
                      {m.sublabel}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={m.href}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold px-3 py-2 hover:bg-gray-800 transition-colors"
                    >
                      Xem ngân hàng đề <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={m.practiceHref}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 text-blue-600 text-xs font-semibold px-3 py-2 hover:bg-blue-50 transition-colors"
                    >
                      Mở trang luyện thi <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
