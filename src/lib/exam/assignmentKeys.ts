export type AssignmentExamType = 'listening' | 'reading' | 'writing' | 'speaking';

/**
 * Khóa ổn định cho một bài gán (trùng `exam_type` + đúng id bài).
 * Dùng chung form gán bài và server kiểm tra trùng.
 */
export function assignmentExamKey(examType: AssignmentExamType, targetId: number): string {
  return `${examType}:${targetId}`;
}
