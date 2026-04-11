"use client";
import { useEffect } from "react";

interface Options {
  onSelectAnswer: (idx: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onFlag: () => void;
  optionCount?: number;
  enabled?: boolean;
}

/**
 * Keyboard shortcuts for exam navigation:
 * - A/B/C/D (or 1/2/3/4) → select answer
 * - ← / J → previous question
 * - → / K → next question
 * - F → flag/unflag current question
 */
export function useKeyboardNav({
  onSelectAnswer, onPrev, onNext, onFlag, optionCount = 4, enabled = true,
}: Options) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toLowerCase();

      // Answer selection: A/B/C/D or 1/2/3/4
      const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
      const numMap: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };

      if (key in letterMap && letterMap[key] < optionCount) {
        e.preventDefault();
        onSelectAnswer(letterMap[key]);
        return;
      }
      if (key in numMap && numMap[key] < optionCount) {
        e.preventDefault();
        onSelectAnswer(numMap[key]);
        return;
      }

      // Navigation
      if (key === "arrowleft" || key === "j") {
        e.preventDefault();
        onPrev();
        return;
      }
      if (key === "arrowright" || key === "k") {
        e.preventDefault();
        onNext();
        return;
      }

      // Flag
      if (key === "f") {
        e.preventDefault();
        onFlag();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSelectAnswer, onPrev, onNext, onFlag, optionCount, enabled]);
}
