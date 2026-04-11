'use client';

import { FileText, Music, File, Download, FolderOpen } from 'lucide-react';
import type { Resource } from '@/lib/types/student-hub';
import { incrementDownloadCount } from '@/app/actions/resource.actions';
import { useState } from 'react';

interface ResourcesSectionProps {
  resources: Resource[];
}

const fileTypeConfig: Record<string, { icon: typeof FileText; color: string; bg: string; label: string }> = {
  pdf: { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', label: 'PDF' },
  audio: { icon: Music, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Audio' },
  doc: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'DOC' },
  other: { icon: File, color: 'text-gray-600', bg: 'bg-gray-50', label: 'File' },
};

export function ResourcesSection({ resources: initialResources }: ResourcesSectionProps) {
  const [resources, setResources] = useState(initialResources);

  const handleDownload = async (resource: Resource) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === resource.id ? { ...r, download_count: r.download_count + 1 } : r
      )
    );
    try {
      await incrementDownloadCount(resource.id);
    } catch {
      // Silently fail
    }
    window.open(resource.file_url, '_blank');
  };

  return (
    <section id="resources" className="bg-white py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#f05e23]">
            Tài liệu miễn phí
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#121212] lg:text-4xl">
            Kho Tài Liệu Học Tập
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[#5d5d5d]">
            Tải ngay các tài liệu ngữ pháp, luyện nghe, và bài tập thực hành hoàn toàn miễn phí.
          </p>
        </div>

        {/* Resources List */}
        {resources.length === 0 ? (
          <div className="mt-10 rounded-[16px] border-2 border-dashed border-[#d7c9b8] bg-[#f3efe6] py-16 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-[#d7c9b8]" />
            <p className="mt-3 text-[#5d5d5d] font-medium">Tài liệu đang được chuẩn bị. Hãy quay lại sớm!</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {resources.map((resource) => {
              const config = fileTypeConfig[resource.file_type] || fileTypeConfig.other;
              const Icon = config.icon;

              return (
                <div
                  key={resource.id}
                  className="group flex items-center gap-4 rounded-[16px] border border-[#e4ddd1] bg-[#f3efe6] p-5 transition hover:shadow-md hover:border-[#f05e23]/30"
                >
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] ${config.bg}`}>
                    <Icon className={`h-7 w-7 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#121212] truncate group-hover:text-[#f05e23] transition-colors">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="mt-0.5 text-sm text-[#5d5d5d] truncate">{resource.description}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-[#999]">
                      <span className="font-semibold uppercase text-[#888]">{config.label}</span>
                      {resource.file_size && <span>• {resource.file_size}</span>}
                      <span>• {resource.download_count} lượt tải</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(resource)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#f05e23] text-white shadow-sm transition hover:bg-[#d85118] hover:scale-105 active:scale-95"
                    aria-label={`Tải ${resource.title}`}
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
