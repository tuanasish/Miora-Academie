'use server'

import { createClient } from '@/lib/supabase/server';
import { Post, CreatePostDTO } from '@/lib/types/post';
import { revalidatePath } from 'next/cache';

export async function getPosts(adminView = false): Promise<Post[]> {
  const supabase = await createClient();
  let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
  
  // If not admin view, only get published posts
  if (!adminView) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error) throw new Error(`Lỗi lấy dữ liệu: ${error.message}`);
  return data || [];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(error.message);
  }
  return data;
}

export async function getPostById(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data;
}

export async function createPost(post: CreatePostDTO): Promise<Post> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/posts');
  revalidatePath('/blog');
  return data;
}

export async function updatePost(id: string, post: Partial<CreatePostDTO>): Promise<Post> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .update(post)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/posts');
  revalidatePath('/blog');
  if (data?.slug) {
    revalidatePath(`/blog/${data.slug}`);
  }
  return data;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/posts');
  revalidatePath('/blog');
}

export async function uploadBlogImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('Không tìm thấy file tải lên');

  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(fileName, file, { upsert: false });

  if (error) throw new Error(`Lỗi tải ảnh: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(fileName);
  return publicUrl;
}
