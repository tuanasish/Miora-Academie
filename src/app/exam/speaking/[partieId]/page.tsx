"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, ChevronLeft, CheckCircle2, Loader2,
  AlertCircle, RotateCcw, Camera, Square, Play,
  Pause, UploadCloud,
} from "lucide-react";
import { useCountdown } from "@/hooks/useTimer";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitExam } from "@/lib/submitExam";
import { playExamChime } from "@/lib/playExamChime";
import DeadlineNotice from "@/components/exam/DeadlineNotice";
import AssignmentNoteNotice from "@/components/exam/AssignmentNoteNotice";
import { useAssignmentDeadline } from "@/hooks/useAssignmentDeadline";

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

interface TaskRecording {
  file: File | null;
  previewUrl: string | null;
  durationSec: number;
}

interface SpeakingUploadUrlResponse {
  uploadUrl: string;
  storagePath: string;
  method: "PUT";
  headers: Record<string, string>;
}

const TACHE2_PREP_SECONDS = 2 * 60;
const TACHE2_SPEAK_SECONDS = 3 * 60 + 30;
const TACHE2_TOTAL_SECONDS = TACHE2_PREP_SECONDS + TACHE2_SPEAK_SECONDS;
const TACHE3_SECONDS = 4 * 60 + 30;

const MAX_MB = 45;
const RECORDING_VIDEO_BITS_PER_SECOND = 900_000;
const RECORDING_AUDIO_BITS_PER_SECOND = 64_000;
const RECORDING_MIME_TYPES = [
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9,opus",
  "video/webm",
  "video/mp4",
];

function emptyRecording(): TaskRecording {
  return { file: null, previewUrl: null, durationSec: 0 };
}

function formatSeconds(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function mimeToExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }
  return RECORDING_MIME_TYPES.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? "";
}

function CircularTimer({
  seconds,
  total,
  label,
  subtitle,
  color,
}: {
  seconds: number;
  total: number;
  label: string;
  subtitle: string;
  color: string;
}) {
  const bounded = Math.max(0, Math.min(1, seconds / total));
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = bounded * circ;
  const isLow = seconds < 30;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={isLow ? "#ef4444" : color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-bold text-3xl ${isLow ? "text-red-600 animate-pulse" : "text-slate-800"}`}>
            {formatSeconds(seconds)}
          </span>
          <span className="text-[11px] text-slate-400 font-semibold mt-1">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}

interface RecordingCardProps {
  title: string;
  subtitle: string;
  colorClass: string;
  recording: TaskRecording;
  isRecording: boolean;
  uploaded: boolean;
  uploading: boolean;
  canStart: boolean;
  canReset: boolean;
  liveStream: MediaStream | null;
  disabledReason?: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

function RecordingCard({
  title,
  subtitle,
  colorClass,
  recording,
  isRecording,
  uploaded,
  uploading,
  canStart,
  canReset,
  liveStream,
  disabledReason,
  onStart,
  onStop,
  onReset,
}: RecordingCardProps) {
  const hasRecording = Boolean(recording.file);
  const primaryDisabled = isRecording ? false : !canStart;
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!liveVideoRef.current) return;
    liveVideoRef.current.srcObject = isRecording ? liveStream : null;
  }, [isRecording, liveStream]);

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${colorClass}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isRecording ? "bg-rose-100 text-rose-600" : hasRecording ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500"
          }`}>
            {hasRecording ? <CheckCircle2 className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{subtitle}</p>
          </div>
        </div>
        <span
          className={`w-fit shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
            uploading
              ? "bg-slate-100 text-slate-600"
              : uploaded
                ? "bg-emerald-100 text-emerald-700"
                : isRecording
                  ? "bg-rose-100 text-rose-700"
                  : hasRecording
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white text-slate-500"
          }`}
        >
          {uploading ? "Téléversement..." : uploaded ? "Téléversé" : isRecording ? "REC en cours" : hasRecording ? "Prêt à soumettre" : "À enregistrer"}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          {isRecording && (
            <div className="overflow-hidden rounded-xl border border-rose-200 bg-slate-950">
              <div className="flex items-center justify-between bg-rose-600 px-3 py-2 text-xs font-bold text-white">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  Caméra active
                </span>
                <span>Ne quittez pas cette page</span>
              </div>
              <video
                ref={liveVideoRef}
                autoPlay
                muted
                playsInline
                className="aspect-video w-full bg-slate-950 object-cover"
              />
            </div>
          )}

          {!isRecording && recording.previewUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <video controls playsInline src={recording.previewUrl} className="aspect-video w-full bg-black object-contain" />
            </div>
          )}

          {!isRecording && !recording.previewUrl && (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70">
              <div className="text-center">
                <Camera className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-500">Chưa có video</p>
              </div>
            </div>
          )}

          {recording.previewUrl && (
            <p className="mt-2 text-xs text-slate-500">
              Durée: <span className="font-semibold text-slate-700">{formatSeconds(recording.durationSec)}</span> ·
              Taille: <span className="font-semibold text-slate-700"> {(recording.file!.size / 1024 / 1024).toFixed(1)} MB</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:min-w-52">
          <button
            onClick={isRecording ? onStop : onStart}
            disabled={primaryDisabled}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg text-white text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-slate-900 hover:bg-slate-800"
              }`}
          >
            <span
              className="items-center gap-2 whitespace-nowrap"
              style={{ display: isRecording ? "inline-flex" : "none" }}
            >
              <Square className="w-4 h-4" />
              <span>Arrêter</span>
            </span>
            <span
              className="items-center gap-2 whitespace-nowrap"
              style={{ display: isRecording ? "none" : "inline-flex" }}
            >
              <Mic className="w-4 h-4 text-red-300" />
              <span>Démarrer</span>
            </span>
          </button>
          <button
            onClick={onReset}
            disabled={!hasRecording || isRecording || !canReset}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-sm font-semibold px-4 py-2.5 transition-colors border border-slate-200"
          >
            <RotateCcw className="w-4 h-4" />
            Refaire
          </button>
        </div>
      </div>

      {!canStart && disabledReason && !isRecording && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
          {disabledReason}
        </p>
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

  const [recording2, setRecording2] = useState<TaskRecording>(emptyRecording());
  const [recording3, setRecording3] = useState<TaskRecording>(emptyRecording());
  const [uploading2, setUploading2] = useState(false);
  const [uploading3, setUploading3] = useState(false);
  const [uploaded2, setUploaded2] = useState(false);
  const [uploaded3, setUploaded3] = useState(false);
  const [recordingTask, setRecordingTask] = useState<2 | 3 | null>(null);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const deadline = useAssignmentDeadline("speaking", partieId);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("video/webm");
  const recordingTaskRef = useRef<2 | 3 | null>(null);
  const recordingStartedAtRef = useRef<number>(0);

  const tache2Timer = useCountdown(TACHE2_TOTAL_SECONDS, false);
  const tache3Timer = useCountdown(TACHE3_SECONDS, false);

  const activeTimer = activeTask === 0 ? tache2Timer : tache3Timer;

  const isTask2Prep = tache2Timer.seconds > TACHE2_SPEAK_SECONDS;
  /** Affichage & anneau : temps restant de la phase courante (2:00 puis 3:30), pas le total 5:30 */
  const task2PhaseRemaining =
    tache2Timer.seconds <= 0
      ? 0
      : isTask2Prep
        ? tache2Timer.seconds - TACHE2_SPEAK_SECONDS
        : tache2Timer.seconds;
  const task2PhaseTotal = isTask2Prep ? TACHE2_PREP_SECONDS : TACHE2_SPEAK_SECONDS;

  const prevT2SecondsRef = useRef(TACHE2_TOTAL_SECONDS);
  const prevT3SecondsRef = useRef(TACHE3_SECONDS);

  useEffect(() => {
    const prev = prevT2SecondsRef.current;
    const s = tache2Timer.seconds;
    if (prev > TACHE2_SPEAK_SECONDS && s === TACHE2_SPEAK_SECONDS) {
      void playExamChime("prepEnd");
    }
    if (prev === 1 && s === 0) {
      void playExamChime("sessionEnd");
    }
    prevT2SecondsRef.current = s;
  }, [tache2Timer.seconds]);

  useEffect(() => {
    const prev = prevT3SecondsRef.current;
    const s = tache3Timer.seconds;
    if (prev === 1 && s === 0) {
      void playExamChime("sessionEnd");
    }
    prevT3SecondsRef.current = s;
  }, [tache3Timer.seconds]);

  const activeTotal = activeTask === 0 ? task2PhaseTotal : TACHE3_SECONDS;
  const activeDisplaySeconds = activeTask === 0 ? task2PhaseRemaining : tache3Timer.seconds;
  const task2PhaseLabel = tache2Timer.seconds === 0
    ? "Terminé"
    : isTask2Prep
      ? "Préparation"
      : "Parole";
  const task2CanRecord = !isTask2Prep && tache2Timer.seconds > 0;
  const task3CanRecord = tache3Timer.seconds > 0;

  useEffect(() => {
    fetch("/data/speaking.json")
      .then((r) => r.json())
      .then((json: SpeakingData) => {
        for (const m of json.months) {
          const found = m.parties.find((p) => p.id === partieId);
          if (found) {
            setPartie(found);
            setMonthName(m.name);
            break;
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [partieId]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    recorder.stop();
    if (recordingTaskRef.current === 2) tache2Timer.pause();
    if (recordingTaskRef.current === 3) tache3Timer.pause();
  }, [tache2Timer, tache3Timer]);

  const resetTaskRecording = useCallback((task: 2 | 3) => {
    if (task === 2) {
      setRecording2((prev) => {
        if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return emptyRecording();
      });
      setUploaded2(false);
      return;
    }

    setRecording3((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return emptyRecording();
    });
    setUploaded3(false);
  }, []);

  const startRecording = useCallback(async (task: 2 | 3) => {
    if (recordingTaskRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicError("Le navigateur ne prend pas en charge l'enregistrement vidéo.");
      return;
    }

    if (task === 2 && !task2CanRecord) {
      setSubmitError("Tâche 2: terminez d'abord les 2 minutes de préparation.");
      return;
    }
    if (task === 3 && !task3CanRecord) {
      setSubmitError("Le temps de la Tâche 3 est terminé. Vous ne pouvez plus réenregistrer cette tâche.");
      return;
    }

    setSubmitError(null);
    setMicError(null);
    setActiveTask(task === 2 ? 0 : 1);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 360 },
          frameRate: { ideal: 15, max: 15 },
        },
      });
      const chosenMime = pickRecorderMimeType();
      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: RECORDING_VIDEO_BITS_PER_SECOND,
        audioBitsPerSecond: RECORDING_AUDIO_BITS_PER_SECOND,
      };
      if (chosenMime) recorderOptions.mimeType = chosenMime;
      const recorder = new MediaRecorder(stream, recorderOptions);

      chunksRef.current = [];
      mimeTypeRef.current = chosenMime || recorder.mimeType || "video/webm";
      recordingTaskRef.current = task;
      recordingStartedAtRef.current = Date.now();
      recorderRef.current = recorder;
      streamRef.current = stream;
      setLiveStream(stream);
      setRecordingTask(task);

      if (task === 2) setUploaded2(false);
      if (task === 3) setUploaded3(false);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const finishedTask = recordingTaskRef.current;
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        const ext = mimeToExtension(mimeTypeRef.current);
        const filename = `tache${finishedTask}_${Date.now()}.${ext}`;
        const file = new File([blob], filename, { type: mimeTypeRef.current });
        const previewUrl = URL.createObjectURL(blob);
        const durationSec = Math.max(1, Math.floor((Date.now() - recordingStartedAtRef.current) / 1000));

        if (finishedTask === 2) {
          setRecording2((prev) => {
            if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
            return { file, previewUrl, durationSec };
          });
        } else if (finishedTask === 3) {
          setRecording3((prev) => {
            if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
            return { file, previewUrl, durationSec };
          });
        }

        stream.getTracks().forEach((track) => track.stop());
        chunksRef.current = [];
        recorderRef.current = null;
        streamRef.current = null;
        recordingTaskRef.current = null;
        setLiveStream(null);
        setRecordingTask(null);
      };

      recorder.onerror = () => {
        setMicError("Erreur pendant l'enregistrement vidéo. Réessayez.");
        stream.getTracks().forEach((track) => track.stop());
        chunksRef.current = [];
        recorderRef.current = null;
        streamRef.current = null;
        recordingTaskRef.current = null;
        setLiveStream(null);
        setRecordingTask(null);
      };

      recorder.start(250);
      if (task === 2) tache2Timer.resume();
      if (task === 3) tache3Timer.resume();
    } catch {
      setMicError("Accès caméra/micro refusé ou indisponible. Autorisez la caméra et le micro puis réessayez.");
      setRecordingTask(null);
      setLiveStream(null);
      recordingTaskRef.current = null;
    }
  }, [task2CanRecord, task3CanRecord, tache2Timer, tache3Timer]);

  const switchTask = (nextTask: 0 | 1) => {
    if (recordingTaskRef.current) {
      setSubmitError("Arrêtez l'enregistrement en cours avant de changer de tâche.");
      return;
    }
    setSubmitError(null);
    setActiveTask(nextTask);
  };

  useEffect(() => {
    if (recordingTask === 2 && tache2Timer.seconds === 0) stopRecording();
  }, [recordingTask, tache2Timer.seconds, stopRecording]);

  useEffect(() => {
    if (recordingTask === 3 && tache3Timer.seconds === 0) stopRecording();
  }, [recordingTask, tache3Timer.seconds, stopRecording]);

  useEffect(() => () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const sujets = partie?.sujets || [];
  const t2 = sujets.find((s) => s.tache === 2);
  const t3 = sujets.find((s) => s.tache === 3);
  const currentSujet = activeTask === 0 ? t2 : t3;

  const handleSubmit = async () => {
    if (recordingTaskRef.current) {
      setSubmitError("Arrêtez l'enregistrement en cours avant la soumission.");
      return;
    }
    if (!recording2.file && !recording3.file) {
      setSubmitError("Enregistrez au moins une tâche avant de soumettre.");
      return;
    }

    if (recording2.file && recording2.file.size > MAX_MB * 1024 * 1024) {
      setSubmitError(`Fichier Tâche 2 trop volumineux (max ${MAX_MB}MB).`);
      return;
    }
    if (recording3.file && recording3.file.size > MAX_MB * 1024 * 1024) {
      setSubmitError(`Fichier Tâche 3 trop volumineux (max ${MAX_MB}MB).`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? "anonymous";

    let storagePath2: string | null = null;
    let storagePath3: string | null = null;

    async function uploadRecordingToR2(task: 2 | 3, recording: TaskRecording) {
      if (!recording.file) return null;

      const uploadUrlRes = await fetch("/api/speaking/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partieId,
          task,
          mimeType: recording.file.type || "video/webm",
          sizeBytes: recording.file.size,
        }),
      });
      const uploadUrlBody = (await uploadUrlRes.json().catch(() => null)) as
        | SpeakingUploadUrlResponse
        | { error?: string }
        | null;

      if (!uploadUrlRes.ok || !uploadUrlBody || !("uploadUrl" in uploadUrlBody)) {
        throw new Error(uploadUrlBody && "error" in uploadUrlBody ? uploadUrlBody.error ?? "UPLOAD_URL_FAILED" : "UPLOAD_URL_FAILED");
      }

      const uploadRes = await fetch(uploadUrlBody.uploadUrl, {
        method: uploadUrlBody.method,
        headers: uploadUrlBody.headers,
        body: recording.file,
      });

      if (!uploadRes.ok) {
        throw new Error(`R2_UPLOAD_FAILED_${uploadRes.status}`);
      }

      return uploadUrlBody.storagePath;
    }

    if (recording2.file) {
      setUploading2(true);
      try {
        storagePath2 = await uploadRecordingToR2(2, recording2);
      } catch (error) {
        setSubmitError(`Échec du téléversement Tâche 2: ${error instanceof Error ? error.message : "UPLOAD_FAILED"}`);
        setSubmitting(false);
        setUploading2(false);
        return;
      }
      setUploaded2(true);
      setUploading2(false);
    }

    if (recording3.file) {
      setUploading3(true);
      try {
        storagePath3 = await uploadRecordingToR2(3, recording3);
      } catch (error) {
        setSubmitError(`Échec du téléversement Tâche 3: ${error instanceof Error ? error.message : "UPLOAD_FAILED"}`);
        setSubmitting(false);
        setUploading3(false);
        return;
      }
      setUploaded3(true);
      setUploading3(false);
    }

    const timeSpentSeconds =
      (TACHE2_TOTAL_SECONDS - tache2Timer.seconds) +
      (TACHE3_SECONDS - tache3Timer.seconds);

    const result = await submitExam({
      exam_type: "speaking",
      partie_id: partieId,
      student_email: user?.email ?? "anonymous",
      student_id: uid,
      time_spent_seconds: Math.max(0, timeSpentSeconds),
      speaking_task1_storage_path: storagePath2 ?? undefined,
      speaking_task2_storage_path: storagePath3 ?? undefined,
      speaking_task1_mime_type: recording2.file?.type || undefined,
      speaking_task2_mime_type: recording3.file?.type || undefined,
      speaking_task1_size_bytes: recording2.file?.size,
      speaking_task2_size_bytes: recording3.file?.size,
      speaking_task1_duration_sec: recording2.file ? recording2.durationSec : undefined,
      speaking_task2_duration_sec: recording3.file ? recording3.durationSec : undefined,
    });

    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      return;
    }
    setSubmitError(`Erreur d'enregistrement: ${result.error}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!partie) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Partie non trouvée.</p>
        <Link href="/exam/speaking" className="text-rose-600 hover:underline">← Retour</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Soumission envoyée!</h2>
          <p className="text-slate-500">Jour {partie.jour} — {monthName}</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-left">
            {recording2.file && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-600">
                  Tâche 2 — vidéo directe ({formatSeconds(recording2.durationSec)})
                </span>
              </div>
            )}
            {recording3.file && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-600">
                  Tâche 3 — vidéo directe ({formatSeconds(recording3.durationSec)})
                </span>
              </div>
            )}
          </div>
          <Link href="/exam/speaking" className="block text-rose-600 hover:underline text-sm mt-4">
            ← Choisir une autre partie
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-100 lg:overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/exam/speaking" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4" />Liste
          </Link>
          <span className="text-slate-300">|</span>
          <Mic className="w-4 h-4 text-rose-500" />
          <h1 className="font-bold text-slate-800">
            Expression Orale — <span className="text-rose-600">Jour {partie.jour}</span>
            <span className="text-slate-400 font-normal ml-2 text-sm">{monthName}</span>
          </h1>
          <AssignmentNoteNotice note={deadline.note} />
        </div>
        <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-1 lg:flex lg:items-center">
          <button
            onClick={() => switchTask(0)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTask === 0 ? "bg-white shadow text-rose-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            Tâche 2 · 2:00 + 3:30
          </button>
          <button
            onClick={() => switchTask(1)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTask === 1 ? "bg-white shadow text-rose-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            Tâche 3 · 4:30
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col-reverse lg:flex-row lg:overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-5 lg:overflow-y-auto">
          <DeadlineNotice dueDateLabel={deadline.formattedDueDate} isOverdue={deadline.isOverdue} />

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${activeTask === 0 ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
              {activeTask === 0 ? "Tâche 2 — Simulation de roleplay" : "Tâche 3 — Point de vue & Débat"}
            </span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${activeTask === 0 ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-500"}`}>
              {activeTask === 0
                ? `${task2PhaseLabel} · ${formatSeconds(task2PhaseRemaining)}`
                : `${formatSeconds(tache3Timer.seconds)} restant`}
            </span>
          </div>

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

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-1">
              <Mic className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800 text-sm">Enregistrement vidéo direct</h3>
              <span className="text-xs text-slate-400 sm:ml-auto">Caméra + micro requis · max {MAX_MB}MB par tâche</span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Étape 1</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">Lancez le timer</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Étape 2</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">Enregistrez la vidéo</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Étape 3</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">Vérifiez puis soumettez</p>
              </div>
            </div>

            <RecordingCard
              title="Tâche 2 · Roleplay"
              subtitle="2:00 préparation puis 3:30 de parole"
              colorClass="border-blue-100 bg-blue-50/40"
              recording={recording2}
              isRecording={recordingTask === 2}
              uploaded={uploaded2}
              uploading={uploading2}
              canStart={task2CanRecord && recordingTask !== 3}
              canReset={task2CanRecord && recordingTask !== 3}
              liveStream={recordingTask === 2 ? liveStream : null}
              disabledReason={isTask2Prep
                ? "Lancez le timer de la Tâche 2 puis attendez la fin des 2:00 de préparation."
                : tache2Timer.seconds === 0
                  ? "Temps écoulé. Vous ne pouvez plus réenregistrer cette tâche."
                  : recordingTask === 3
                    ? "Arrêtez d'abord l'enregistrement de la Tâche 3."
                    : null}
              onStart={() => startRecording(2)}
              onStop={stopRecording}
              onReset={() => resetTaskRecording(2)}
            />

            <RecordingCard
              title="Tâche 3 · Débat"
              subtitle="4:30 de parole"
              colorClass="border-orange-100 bg-orange-50/40"
              recording={recording3}
              isRecording={recordingTask === 3}
              uploaded={uploaded3}
              uploading={uploading3}
              canStart={task3CanRecord && recordingTask !== 2}
              canReset={task3CanRecord && recordingTask !== 2}
              liveStream={recordingTask === 3 ? liveStream : null}
              disabledReason={tache3Timer.seconds === 0
                ? "Temps écoulé. Vous ne pouvez plus réenregistrer cette tâche."
                : recordingTask === 2
                  ? "Arrêtez d'abord l'enregistrement de la Tâche 2."
                  : null}
              onStart={() => startRecording(3)}
              onStop={stopRecording}
              onReset={() => resetTaskRecording(3)}
            />

            {(submitError || micError) && (
              <div className="space-y-2">
                {submitError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                )}
                {micError && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-700">{micError}</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || (!recording2.file && !recording3.file)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              {submitting
                ? uploading2 ? "Téléversement Tâche 2..."
                : uploading3 ? "Téléversement Tâche 3..."
                : "Enregistrement..."
                : "Soumettre"}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Consigne:</p>
            {activeTask === 0 ? (
              <p>Démarrez le timer de la Tâche 2. Les 2 premières minutes sont réservées à la préparation, puis lancez l&apos;enregistrement direct pour la phase de parole (3:30).</p>
            ) : (
              <p>Lancez l&apos;enregistrement direct pour la Tâche 3 et respectez la limite de 4:30.</p>
            )}
          </div>
        </main>

        <aside className="bg-white border-b border-slate-200 p-4 sm:p-6 lg:w-60 lg:border-b-0 lg:border-l lg:flex lg:flex-col lg:items-center lg:p-8 lg:gap-6 shrink-0">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 lg:flex lg:flex-col lg:gap-6">
          <CircularTimer
            seconds={activeDisplaySeconds}
            total={activeTotal}
            label={activeTask === 0 ? "Tâche 2" : "Tâche 3"}
            subtitle={activeTask === 0 ? task2PhaseLabel : "Parole"}
            color={activeTask === 0 ? "#3b82f6" : "#f97316"}
          />

          <div className="w-full space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Minuteur</p>
            <button
              onClick={activeTimer.isRunning ? activeTimer.pause : activeTimer.resume}
              disabled={recordingTask === (activeTask === 0 ? 2 : 3)}
              className={`min-h-12 w-full inline-flex items-center justify-center rounded-xl px-4 text-sm font-bold shadow-sm transition-colors ${
                activeTimer.isRunning
                  ? "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  : "bg-rose-600 text-white hover:bg-rose-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span
                className="items-center gap-2 whitespace-nowrap"
                style={{ display: activeTimer.isRunning ? "inline-flex" : "none" }}
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </span>
              <span
                className="items-center gap-2 whitespace-nowrap"
                style={{ display: activeTimer.isRunning ? "none" : "inline-flex" }}
              >
                <Play className="w-4 h-4" />
                <span>Démarrer</span>
              </span>
            </button>
            </div>

            <div className="flex items-center justify-center gap-3 mt-2 lg:mt-0">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${uploaded2 ? "bg-emerald-400" : recording2.file ? "bg-blue-400" : "bg-slate-200"}`} />
              <span className="text-xs text-slate-400">T2</span>
            </div>
            <div className="h-px w-8 bg-slate-200" />
            <div className="flex flex-col items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${uploaded3 ? "bg-emerald-400" : recording3.file ? "bg-orange-400" : "bg-slate-200"}`} />
              <span className="text-xs text-slate-400">T3</span>
            </div>
            </div>

            <p className="hidden lg:block text-xs text-slate-400 text-center mt-auto leading-relaxed">
            Tâche 2 : le cercle affiche le temps de la phase en cours (2:00 puis 3:30). Un signal sonore marque la fin de chaque phase.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
