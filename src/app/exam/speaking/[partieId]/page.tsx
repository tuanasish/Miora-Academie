"use client";
import { useState, useEffect, useRef } from "react";
import {
  Mic, ChevronLeft, CheckCircle2, ArrowRight, Loader2,
  Upload, FileAudio, X, AlertCircle,
} from "lucide-react";
import { useCountdown } from "@/hooks/useTimer";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitExam } from "@/lib/submitExam";

interface Sujet {
  id: number;
  tache: number;
  title: string;
  description: string | null;
  question: string | null;
}

interface Partie {
  id: number;
  jour: number;
  date: string;
  sujets: Sujet[];
}

interface Month {
  name: string;
  parties: Partie[];
}

interface SpeakingData {
  months: Month[];
}

const TACHE2_SECONDS = 2 * 60 + 30;
const TACHE3_SECONDS = 4 * 60 + 30;

const ACCEPTED = ".mp3,.mp4,.wav,.ogg,.webm,.m4a,.mov";
const MAX_MB = 100;

function CircularTimer({ seconds, total, label, color }: {
  seconds: number; total: number; label: string; color: string;
}) {
  const pct = seconds / total;
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  const isLow = seconds < 30;
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle cx="64" cy="64" r={r} fill="none"
            stroke={isLow ? "#ef4444" : color}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-bold text-3xl ${isLow ? "text-red-600 animate-pulse" : "text-slate-800"}`}>
            {mins}:{secs}
          </span>
          {isLow && <span className="text-xs text-red-500 font-semibold">Vite!</span>}
        </div>
      </div>
    </div>
  );
}

interface UploadZoneProps {
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
  uploading: boolean;
  uploaded: boolean;
  color: string;
}

function UploadZone({ label, file, onFile, uploading, uploaded, color }: UploadZoneProps) {
  const ref = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div className="w-full">
      <input
        ref={ref}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      {file ? (
        <div className={`flex items-center gap-3 border-2 rounded-xl p-4 ${uploaded ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
          {uploading ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin shrink-0" />
          ) : uploaded ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <FileAudio className="w-5 h-5 shrink-0" style={{ color }} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB · {label}</p>
          </div>
          {!uploading && !uploaded && (
            <button onClick={() => onFile(null)} className="text-slate-300 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => ref.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all"
        >
          <Upload className="w-8 h-8 mx-auto mb-2" style={{ color }} />
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="text-xs text-slate-400 mt-1">
            Kéo thả hoặc click để chọn file<br />
            <span className="font-mono">MP3 · MP4 · WAV · M4A · WEBM</span> · max {MAX_MB}MB
          </p>
        </div>
      )}
    </div>
  );
}

export default function SpeakingExamPage() {
  const params = useParams();
  const partieId = Number(params.partieId);

  const [partie, setPartie] = useState<Partie | null>(null);
  const [monthName, setMonthName] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(0);

  // Upload state
  const [file2, setFile2] = useState<File | null>(null);
  const [file3, setFile3] = useState<File | null>(null);
  const [uploading2, setUploading2] = useState(false);
  const [uploading3, setUploading3] = useState(false);
  const [uploaded2, setUploaded2] = useState(false);
  const [uploaded3, setUploaded3] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const tache2Timer = useCountdown(TACHE2_SECONDS, false);
  const tache3Timer = useCountdown(TACHE3_SECONDS, false);
  const activeTimer = activeTask === 0 ? tache2Timer : tache3Timer;
  const totalSec = activeTask === 0 ? TACHE2_SECONDS : TACHE3_SECONDS;

  useEffect(() => {
    fetch("/data/speaking.json")
      .then((r) => r.json())
      .then((json: SpeakingData) => {
        for (const m of json.months) {
          const found = m.parties.find((p) => p.id === partieId);
          if (found) { setPartie(found); setMonthName(m.name); break; }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [partieId]);

  const sujets = partie?.sujets || [];
  const t2 = sujets.find((s) => s.tache === 2);
  const t3 = sujets.find((s) => s.tache === 3);
  const currentSujet = activeTask === 0 ? t2 : t3;

  // Validate file size
  const validateFile = (f: File): string | null => {
    if (f.size > MAX_MB * 1024 * 1024) return `File quá lớn (max ${MAX_MB}MB)`;
    return null;
  };

  const handleFile2 = (f: File | null) => {
    if (f && validateFile(f)) { setSubmitError(validateFile(f)); return; }
    setFile2(f); setUploaded2(false); setSubmitError(null);
  };

  const handleFile3 = (f: File | null) => {
    if (f && validateFile(f)) { setSubmitError(validateFile(f)); return; }
    setFile3(f); setUploaded3(false); setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!file2 && !file3) {
      setSubmitError("Vui lòng upload ít nhất 1 file.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? "anonymous";

    let url2: string | null = null;
    let url3: string | null = null;

    // Upload Tâche 2
    if (file2) {
      setUploading2(true);
      const ext = file2.name.split(".").pop();
      const path = `${uid}/${partieId}/tache2_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("speaking-submissions")
        .upload(path, file2, { upsert: true });
      if (error) { setSubmitError("Upload Tâche 2 thất bại: " + error.message); setSubmitting(false); setUploading2(false); return; }
      const { data: urlData } = supabase.storage.from("speaking-submissions").getPublicUrl(path);
      url2 = urlData.publicUrl;
      setUploaded2(true);
      setUploading2(false);
    }

    // Upload Tâche 3
    if (file3) {
      setUploading3(true);
      const ext = file3.name.split(".").pop();
      const path = `${uid}/${partieId}/tache3_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("speaking-submissions")
        .upload(path, file3, { upsert: true });
      if (error) { setSubmitError("Upload Tâche 3 thất bại: " + error.message); setSubmitting(false); setUploading3(false); return; }
      const { data: urlData } = supabase.storage.from("speaking-submissions").getPublicUrl(path);
      url3 = urlData.publicUrl;
      setUploaded3(true);
      setUploading3(false);
    }

    // Save to DB
    const result = await submitExam({
      exam_type: "speaking",
      partie_id: partieId,
      student_email: user?.email ?? "anonymous",
      student_id: uid,
      speaking_task1_video_url: url2 ?? undefined,
      speaking_task2_video_url: url3 ?? undefined,
    } as Parameters<typeof submitExam>[0]);

    setSubmitting(false);
    if (result.success) setSubmitted(true);
    else setSubmitError("Lỗi lưu bài: " + result.error);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
    </div>
  );

  if (!partie) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500">Partie non trouvée.</p>
      <Link href="/exam/speaking" className="text-rose-600 hover:underline">← Retour</Link>
    </div>
  );

  if (submitted) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Bài đã nộp!</h2>
        <p className="text-slate-500">Jour {partie.jour} — {monthName}</p>
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-left">
          {file2 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-600">Tâche 2 — <span className="font-medium text-slate-800 truncate">{file2.name}</span></span>
            </div>
          )}
          {file3 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-600">Tâche 3 — <span className="font-medium text-slate-800 truncate">{file3.name}</span></span>
            </div>
          )}
        </div>
        <Link href="/exam/speaking" className="block text-rose-600 hover:underline text-sm mt-4">
          ← Choisir une autre partie
        </Link>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/exam/speaking" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4" />Danh sách
          </Link>
          <span className="text-slate-300">|</span>
          <Mic className="w-4 h-4 text-rose-500" />
          <h1 className="font-bold text-slate-800">
            Expression Orale — <span className="text-rose-600">Jour {partie.jour}</span>
            <span className="text-slate-400 font-normal ml-2 text-sm">{monthName}</span>
          </h1>
        </div>
        {/* Task tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTask(0)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTask === 0 ? "bg-white shadow text-rose-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            Tâche 2 · 2:30
          </button>
          <button
            onClick={() => setActiveTask(1)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTask === 1 ? "bg-white shadow text-rose-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            Tâche 3 · 4:30
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT – Subject */}
        <main className="flex-1 p-8 flex flex-col gap-5 overflow-y-auto">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${activeTask === 0 ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
              {activeTask === 0 ? "Tâche 2 — Simulation de roleplay" : "Tâche 3 — Point de vue & Débat"}
            </span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${activeTask === 0 ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-500"}`}>
              {activeTask === 0 ? "2 min 30 sec" : "4 min 30 sec"}
            </span>
          </div>

          {/* Sujet card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-lg font-bold text-slate-900 leading-relaxed">
              {currentSujet?.title || "—"}
            </p>
            {currentSujet?.question && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500 mb-2 font-semibold">Questions guide :</p>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{currentSujet.question}</p>
              </div>
            )}
            {currentSujet?.description && (
              <div className="mt-3">
                <p className="text-sm text-slate-500 italic">{currentSujet.description}</p>
              </div>
            )}
          </div>

          {/* Upload section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-700 text-sm">Nộp file bài nói</h3>
              <span className="text-xs text-slate-400 ml-auto">Upload cả 2 tâche hoặc từng cái</span>
            </div>

            <UploadZone
              label="Tâche 2 · Roleplay (2:30)"
              file={file2}
              onFile={handleFile2}
              uploading={uploading2}
              uploaded={uploaded2}
              color="#3b82f6"
            />
            <UploadZone
              label="Tâche 3 · Débat (4:30)"
              file={file3}
              onFile={handleFile3}
              uploading={uploading3}
              uploaded={uploaded3}
              color="#f97316"
            />

            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || (!file2 && !file3)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {submitting
                ? uploading2 ? "Đang upload Tâche 2..."
                : uploading3 ? "Đang upload Tâche 3..."
                : "Đang lưu..."
                : "Nộp bài"}
            </button>
          </div>

          {/* Tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">💡 Hướng dẫn nộp bài:</p>
            {activeTask === 0 ? (
              <p>Ghi âm phần roleplay của Tâche 2 (tối đa 2:30), sau đó upload file MP3/MP4/WAV.</p>
            ) : (
              <p>Ghi âm phần debate của Tâche 3 (tối đa 4:30), sau đó upload file MP3/MP4/WAV.</p>
            )}
          </div>
        </main>

        {/* RIGHT – Timer */}
        <aside className="w-56 bg-white border-l border-slate-200 flex flex-col items-center p-8 gap-6 shrink-0">
          <CircularTimer
            seconds={activeTimer.seconds}
            total={totalSec}
            label={activeTask === 0 ? "Tâche 2" : "Tâche 3"}
            color={activeTask === 0 ? "#3b82f6" : "#f97316"}
          />

          <div className="flex flex-col gap-2 w-full text-center">
            <button
              onClick={activeTimer.isRunning ? activeTimer.pause : activeTimer.resume}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                activeTimer.isRunning
                  ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  : "bg-rose-600 text-white hover:bg-rose-700"
              }`}
            >
              {activeTimer.isRunning ? "⏸ Dừng" : "▶ Bắt đầu"}
            </button>
            <button onClick={activeTimer.reset} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Reset timer
            </button>
          </div>

          {/* Upload status dots */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${uploaded2 ? "bg-emerald-400" : file2 ? "bg-blue-400" : "bg-slate-200"}`} />
              <span className="text-xs text-slate-400">T2</span>
            </div>
            <div className="h-px w-8 bg-slate-200" />
            <div className="flex flex-col items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${uploaded3 ? "bg-emerald-400" : file3 ? "bg-orange-400" : "bg-slate-200"}`} />
              <span className="text-xs text-slate-400">T3</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-auto leading-relaxed">
            Dùng timer để theo dõi thời gian ghi âm.
          </p>
        </aside>
      </div>
    </div>
  );
}
