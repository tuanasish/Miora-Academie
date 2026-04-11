"use client";
import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, ArrowLeft, ChevronRight, Trophy, Star, Target } from "lucide-react";
import Link from "next/link";

interface Props {
  serieId: number;
  correct: number;
  total: number;
  examType: "listening" | "reading";
  children?: React.ReactNode; // correction list
}

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export default function ScoreReveal({ serieId, correct, total, examType, children }: Props) {
  const pct = Math.round((correct / total) * 100);
  const animatedScore = useCountUp(correct);
  const animatedPct = useCountUp(pct);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (pct >= 75) {
      const t = setTimeout(() => setShowConfetti(true), 600);
      return () => clearTimeout(t);
    }
  }, [pct]);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const rating = useMemo(() => {
    if (pct >= 90) return { icon: Trophy, label: "Excellent !", color: "text-amber-500", bg: "bg-amber-100" };
    if (pct >= 75) return { icon: Star, label: "Très bien !", color: "text-emerald-600", bg: "bg-emerald-100" };
    if (pct >= 50) return { icon: Target, label: "Bien", color: "text-[#f05e23]", bg: "bg-[#f05e23]/10" };
    return { icon: Target, label: "À améliorer", color: "text-[#888]", bg: "bg-[#ede8dd]" };
  }, [pct]);

  const RatingIcon = rating.icon;
  const listHref = `/exam/${examType}`;
  const nextHref = serieId < 40 ? `/exam/${examType}/${serieId + 1}` : null;

  const confettiColors = ["#f05e23", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <div className="min-h-screen bg-[#f3efe6] pb-12">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="confetti-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${-10 - Math.random() * 20}px`,
                backgroundColor: confettiColors[i % confettiColors.length],
                width: `${6 + Math.random() * 6}px`,
                height: `${6 + Math.random() * 6}px`,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                animationDelay: `${Math.random() * 0.8}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Score Header */}
      <div className="bg-[#faf8f5] border-b border-[#e4ddd1] px-4 py-10 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4 anim-fade-in" />
        <h2 className="text-2xl font-display font-bold text-[#3d3d3d] anim-fade-in" style={{ animationDelay: "0.1s" }}>
          Série {serieId} — Terminée !
        </h2>

        {/* Animated score */}
        <div className="mt-4 anim-count-up" style={{ animationDelay: "0.3s" }}>
          <span className="text-5xl font-display font-extrabold text-[#f05e23]">
            {animatedScore}
          </span>
          <span className="text-2xl font-display font-bold text-[#888]">/{total}</span>
        </div>

        {/* Percentage bar */}
        <div className="max-w-xs mx-auto mt-4">
          <div className="h-3 bg-[#ede8dd] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full anim-bar-fill"
              style={{
                width: `${pct}%`,
                background: pct >= 75 ? "linear-gradient(90deg, #10b981, #059669)"
                  : pct >= 50 ? "linear-gradient(90deg, #f05e23, #f59e0b)"
                  : "linear-gradient(90deg, #ef4444, #f97316)",
              }}
            />
          </div>
          <p className="text-sm text-[#888] mt-2">{animatedPct}% de bonnes réponses</p>
        </div>

        {/* Rating badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full anim-fade-in"
          style={{ animationDelay: "0.8s", background: "transparent" }}>
          <div className={`w-8 h-8 rounded-full ${rating.bg} flex items-center justify-center`}>
            <RatingIcon className={`w-4 h-4 ${rating.color}`} />
          </div>
          <span className={`font-display font-bold text-sm ${rating.color}`}>{rating.label}</span>
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3 justify-center pt-5" style={showContent ? {} : { opacity: 0 }}>
          <Link href={listHref}
            className="flex items-center gap-2 text-sm text-[#5d5d5d] border border-[#e4ddd1] rounded-xl px-4 py-2.5 hover:bg-[#f3efe6] transition-colors">
            <ArrowLeft className="w-4 h-4" />Liste des séries
          </Link>
          {nextHref && (
            <Link href={nextHref}
              className="flex items-center gap-2 text-sm bg-[#f05e23] text-white rounded-xl px-4 py-2.5 hover:bg-[#d85118] transition-colors font-semibold">
              Série {serieId + 1}<ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Correction list (passed as children) */}
      {showContent && children}
    </div>
  );
}
