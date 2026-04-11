// ============================================================
// Student Hub Types - Góc Học Viên
// ============================================================

// --- Resources (Tài liệu miễn phí) ---

export type FileType = 'pdf' | 'audio' | 'doc' | 'other';

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: FileType;
  file_size: string | null;
  download_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateResourceDTO {
  title: string;
  description?: string;
  file_url: string;
  file_type?: FileType;
  file_size?: string;
  is_active?: boolean;
}

// --- Testimonials (Feedback học viên) ---

export interface Testimonial {
  id: string;
  student_name: string;
  avatar_url: string | null;
  course: string | null;
  quote: string;
  rating: number; // 1-5
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface CreateTestimonialDTO {
  student_name: string;
  avatar_url?: string;
  course?: string;
  quote: string;
  rating?: number;
  is_active?: boolean;
  display_order?: number;
}

// --- Achievements (Thành tựu học viên) ---

export interface Achievement {
  id: string;
  student_name: string;
  avatar_url: string | null;
  achievement: string;
  description: string | null;
  year: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface CreateAchievementDTO {
  student_name: string;
  avatar_url?: string;
  achievement: string;
  description?: string;
  year?: string;
  is_active?: boolean;
  display_order?: number;
}

// --- Post Category (mở rộng) ---

export type PostCategory = 'blog' | 'tips' | 'news';
