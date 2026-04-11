'use server'

import { createClient } from '@/lib/supabase/server';
import { Resource, CreateResourceDTO } from '@/lib/types/student-hub';
import { revalidatePath } from 'next/cache';

// --- Public ---

export async function getResources(): Promise<Resource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Lỗi lấy tài liệu: ${error.message}`);
  return data || [];
}

export async function getAllResources(): Promise<Resource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Lỗi lấy tài liệu: ${error.message}`);
  return data || [];
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data;
}

// --- Admin CRUD ---

export async function createResource(resource: CreateResourceDTO): Promise<Resource> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resources')
    .insert([resource])
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/resources');
  revalidatePath('/goc-hoc-vien');
  return data;
}

export async function updateResource(id: string, resource: Partial<CreateResourceDTO>): Promise<Resource> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resources')
    .update(resource)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/resources');
  revalidatePath('/goc-hoc-vien');
  return data;
}

export async function deleteResource(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/resources');
  revalidatePath('/goc-hoc-vien');
}

// --- Download count increment ---

export async function incrementDownloadCount(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('increment_download_count', { resource_id: id });

  // Fallback: nếu chưa có RPC function thì dùng manual update
  if (error) {
    const { data: resource } = await supabase
      .from('resources')
      .select('download_count')
      .eq('id', id)
      .single();

    if (resource) {
      await supabase
        .from('resources')
        .update({ download_count: resource.download_count + 1 })
        .eq('id', id);
    }
  }
}

// --- Upload resource file ---

export async function uploadResourceFile(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('Không tìm thấy file tải lên');

  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('resources')
    .upload(fileName, file, { upsert: false });

  if (error) throw new Error(`Lỗi tải file: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(fileName);
  return publicUrl;
}
