import { Download } from "lucide-react";

interface SpeakingRecordingPlayerProps {
  url: string;
  mimeType?: string | null;
}

export default function SpeakingRecordingPlayer({ url, mimeType }: SpeakingRecordingPlayerProps) {
  const isVideo = mimeType?.startsWith("video/") ?? false;

  return (
    <div className="space-y-3">
      {isVideo ? (
        <video controls preload="metadata" playsInline className="w-full max-h-[480px] rounded-lg bg-black">
          <source src={url} type={mimeType ?? undefined} />
        </video>
      ) : (
        <audio controls preload="metadata" className="w-full h-12">
          <source src={url} type={mimeType ?? undefined} />
        </audio>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
      >
        <Download className="w-3.5 h-3.5" /> Tải file gốc
      </a>
    </div>
  );
}
