'use server'

import { createClient } from '@/lib/supabase/server';
import { Testimonial, CreateTestimonialDTO } from '@/lib/types/student-hub';
import { revalidatePath } from 'next/cache';

// --- Public ---

export async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Lỗi lấy feedback: ${error.message}`);
  return data || [];
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Lỗi lấy feedback: ${error.message}`);
  return data || [];
}

export async function getTestimonialById(id: string): Promise<Testimonial | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
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

export async function createTestimonial(testimonial: CreateTestimonialDTO): Promise<Testimonial> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
    .insert([testimonial])
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/testimonials');
  revalidatePath('/goc-hoc-vien');
  return data;
}

export async function updateTestimonial(id: string, testimonial: Partial<CreateTestimonialDTO>): Promise<Testimonial> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
    .update(testimonial)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/testimonials');
  revalidatePath('/goc-hoc-vien');
  return data;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/testimonials');
  revalidatePath('/goc-hoc-vien');
}
