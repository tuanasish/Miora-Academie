export type ExamType = "listening" | "reading" | "writing" | "speaking";
export type UserRole = "admin" | "student";

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

export interface ExamAssignment {
  id: string;
  student_email: string;
  exam_type: ExamType;
  assigned_by?: string;
  assigned_at: string;
}

export interface ExamSubmission {
  id: string;
  student_email: string;
  exam_type: ExamType;
  submitted_at: string;
  answers?: Record<string, string>;
  score?: number;
  writing_task1?: string;
  writing_task2?: string;
  writing_task3?: string;
  speaking_task1_video_url?: string;
  speaking_task2_video_url?: string;
  time_spent_seconds?: number;
  notes?: string;
}
