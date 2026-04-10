export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  thumbnail_url: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
}

export interface CreatePostDTO {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  thumbnail_url?: string;
  status?: PostStatus;
}
