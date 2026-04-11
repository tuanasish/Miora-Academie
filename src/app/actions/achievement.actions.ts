'use server'

import { createClient } from '@/lib/supabase/server';
import { Achievement, CreateAchievementDTO } from '@/lib/types/student-hub';
import { revalidatePath } from 'next/cache';

// --- Public ---

export async function getAchievements(): Promise<Achievement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Lỗi lấy thành tựu: ${error.message}`);
  return data || [];
}

export async function getAllAchievements(): Promise<Achievement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Lỗi lấy thành tựu: ${error.message}`);
  return data || [];
}

export async function getAchievementById(id: string): Promise<Achievement | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('achievements')
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

export async function createAchievement(achievement: CreateAchievementDTO): Promise<Achievement> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('achievements')
    .insert([achievement])
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/achievements');
  revalidatePath('/goc-hoc-vien');
  return data;
}

export async function updateAchievement(id: string, achievement: Partial<CreateAchievementDTO>): Promise<Achievement> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('achievements')
    .update(achievement)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/achievements');
  revalidatePath('/goc-hoc-vien');
  return data;
}

export async function deleteAchievement(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('achievements')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/achievements');
  revalidatePath('/goc-hoc-vien');
}
