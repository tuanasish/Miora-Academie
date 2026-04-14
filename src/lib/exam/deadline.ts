export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export const VIETNAM_TIME_ZONE_LABEL = 'GMT+7';

export function parseDueDateEnd(dueDate: string | null | undefined): Date | null {
  if (!dueDate) return null;

  const dateOnlyMatched = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatched) {
    const [, year, month, day] = dateOnlyMatched;
    return new Date(`${year}-${month}-${day}T23:59:59.999+07:00`);
  }

  const localDateTimeMatched = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (localDateTimeMatched) {
    return new Date(`${dueDate}:00+07:00`);
  }

  const parsed = new Date(dueDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isDueDateOverdue(dueDate: string | null | undefined, now = new Date()): boolean {
  const deadline = parseDueDateEnd(dueDate);
  if (!deadline) return false;
  return deadline.getTime() < now.getTime();
}

export function formatDueDate(dueDate: string | null | undefined, locale = 'vi-VN'): string | null {
  const parsed = parseDueDateEnd(dueDate);
  if (!parsed) return null;

  const formatted = new Intl.DateTimeFormat(locale, {
    timeZone: VIETNAM_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);

  return `${formatted} ${VIETNAM_TIME_ZONE_LABEL}`;
}

export function toVietnamDeadlineIso(input: string | null | undefined): string | null {
  if (!input) return null;

  const parsed = parseDueDateEnd(input);
  if (!parsed) return null;
  return parsed.toISOString();
}

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Chuỗi YYYY-MM-DD → ISO UTC đầu ngày theo Asia/Ho_Chi_Minh. */
export function vietnamDayStartIso(ymd: string | null | undefined): string | null {
  if (!ymd || !YMD.test(ymd.trim())) return null;
  const d = new Date(`${ymd.trim()}T00:00:00.000+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Chuỗi YYYY-MM-DD → ISO UTC cuối ngày theo Asia/Ho_Chi_Minh. */
export function vietnamDayEndIso(ymd: string | null | undefined): string | null {
  if (!ymd || !YMD.test(ymd.trim())) return null;
  const d = new Date(`${ymd.trim()}T23:59:59.999+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Trả về thời điểm hiện tại (hoặc `base`) theo múi giờ Việt Nam
 * dưới dạng `YYYY-MM-DDTHH:mm` – phù hợp cho `<input type="datetime-local">`.
 * Nếu truyền `offsetMinutes` sẽ cộng thêm phút vào kết quả.
 */
export function getNowVietnamLocalInput(offsetMinutes = 0, base: Date = new Date()): string {
  const shifted = new Date(base.getTime() + offsetMinutes * 60_000);
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(shifted);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
