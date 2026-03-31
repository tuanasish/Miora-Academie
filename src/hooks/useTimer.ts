"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/** Countdown timer — counts down from initialSeconds to 0 */
export function useCountdown(initialSeconds: number, autoStart = true) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clear(); setIsRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return clear;
  }, [isRunning, clear]);

  const pause = useCallback(() => { clear(); setIsRunning(false); }, [clear]);
  const resume = useCallback(() => setIsRunning(true), []);
  const reset = useCallback(() => { clear(); setSeconds(initialSeconds); setIsRunning(false); }, [clear, initialSeconds]);

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const isExpired = seconds === 0;

  return { seconds, formatted, isRunning, isExpired, pause, resume, reset };
}

/** Stopwatch — counts up from 0 */
export function useStopwatch(autoStart = false) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return clear;
  }, [isRunning, clear]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => { clear(); setIsRunning(false); }, [clear]);
  const reset = useCallback(() => { clear(); setSeconds(0); setIsRunning(false); }, [clear]);

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return { seconds, formatted, isRunning, start, pause, reset };
}
