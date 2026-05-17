"use client";

import { useEffect, useMemo, useState } from "react";
import fixWebmDuration from "fix-webm-duration";
import { Download } from "lucide-react";

interface SpeakingRecordingPlayerProps {
  url: string;
  mimeType?: string | null;
  durationSec?: number | null;
  filename?: string;
}

function extensionForMime(mimeType?: string | null) {
  if (mimeType?.includes("mp4")) return "mp4";
  if (mimeType?.includes("ogg")) return "ogg";
  if (mimeType?.includes("mpeg")) return "mp3";
  if (mimeType?.includes("wav")) return "wav";
  return "webm";
}

async function normalizePlaybackBlob(blob: Blob, mimeType?: string | null, durationSec?: number | null) {
  const typedBlob = blob.type ? blob : new Blob([blob], { type: mimeType ?? "video/webm" });
  if (!mimeType?.includes("webm") || !durationSec || durationSec <= 0) return typedBlob;

  try {
    return await fixWebmDuration(typedBlob, durationSec * 1000, { logger: false });
  } catch (error) {
    console.warn("[SpeakingRecordingPlayer] webm duration fix failed:", error);
    return typedBlob;
  }
}

export default function SpeakingRecordingPlayer({
  url,
  mimeType,
  durationSec,
  filename,
}: SpeakingRecordingPlayerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const isVideo = mimeType?.startsWith("video/") ?? false;
  const downloadName = useMemo(
    () => filename ?? `speaking-recording.${extensionForMime(mimeType)}`,
    [filename, mimeType],
  );
  const playbackUrl = objectUrl ?? url;

  useEffect(() => {
    let cancelled = false;
    let localUrl: string | null = null;

    async function prepareBlobUrl() {
      setIsPreparing(true);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`FETCH_RECORDING_FAILED_${response.status}`);
        const fixedBlob = await normalizePlaybackBlob(await response.blob(), mimeType, durationSec);
        if (cancelled) return;
        localUrl = URL.createObjectURL(fixedBlob);
        setObjectUrl(localUrl);
      } catch (error) {
        console.warn("[SpeakingRecordingPlayer] using signed URL fallback:", error);
        if (!cancelled) setObjectUrl(null);
      } finally {
        if (!cancelled) setIsPreparing(false);
      }
    }

    void prepareBlobUrl();

    return () => {
      cancelled = true;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [durationSec, mimeType, url]);

  return (
    <div className="space-y-3">
      {isVideo ? (
        <video key={playbackUrl} controls preload="metadata" playsInline className="w-full max-h-[480px] rounded-lg bg-black">
          <source src={playbackUrl} type={mimeType ?? undefined} />
        </video>
      ) : (
        <audio key={playbackUrl} controls preload="metadata" className="w-full h-12">
          <source src={playbackUrl} type={mimeType ?? undefined} />
        </audio>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={playbackUrl}
          download={downloadName}
          target={objectUrl ? undefined : "_blank"}
          rel={objectUrl ? undefined : "noopener noreferrer"}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" /> Tải video xuống
        </a>
        {isPreparing && (
          <span className="text-[11px] font-medium text-slate-400">Đang chuẩn bị thanh tua...</span>
        )}
      </div>
    </div>
  );
}
