import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createMockUser(email: string, fullName: string, role: string, isApprovalNeeded: boolean = false) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role,
    },
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log(`User ${email} already exists. Attempting to fetch id for updating...`);
      // Update role if user already exists
       const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
       const existingUser = usersData.users.find(u => u.email === email);
       if (existingUser) {
           await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
             user_metadata: { full_name: fullName, role: role }
           });
           console.log(`Updated meta for existing user ${email}.`);
           return existingUser;
       }
    } else {
        console.error(`Error creating ${email}:`, error.message);
    }
    return null;
  }

  console.log(`✅ Created ${role}: ${email}`);
  
  // The handle_new_user trigger in DB will automatically create the profile.
  // We can just confirm it or set status to ACTIVE if it's admin or student
  if (data?.user) {
    if (role === 'admin' || role === 'teacher') {
       const status = (role === 'teacher' && isApprovalNeeded) ? 'pending' : 'active';
       await supabaseAdmin.from('profiles').update({ status }).eq('id', data.user.id);
    }
  }

  return data.user;
}

async function main() {
  console.log('🌱 Bắt đầu seeder dữ liệu tĩnh RBAC...');

  // 1 Admin
  await createMockUser('admin@miora.com', 'Admin Miora', 'admin');

  // 2 Giáo viên
  const teacher1 = await createMockUser('teacher1@miora.com', 'Giáo viên Ngọc', 'teacher');
  const teacher2 = await createMockUser('teacher2@miora.com', 'Giáo viên Anh', 'teacher', true); // demo pending status

  // 5 Học viên
  const students = [];
  for (let i = 1; i <= 5; i++) {
    const student = await createMockUser(`student${i}@miora.com`, `Học viên ${i}`, 'student');
    if (student) students.push(student);
  }

  if (teacher1 && students.length >= 2) {
    // Phân công 2 sinh viên đầu cho teacher 1
    console.log('📌 Phân công học viên cho Giáo Viên 1...');
    for (let i = 0; i < 2; i++) {
        const res = await supabaseAdmin.from('teacher_students').upsert({
            teacher_id: teacher1.id,
            student_id: students[i].id
        }, { onConflict: 'teacher_id,student_id' });
        if (res.error) console.error("Error linking:", res.error.message);
    }
    console.log('✅ Đã phân công lớp.');
  }

  console.log('🎉 Hoàn tất quá trình seed.');
}

main().catch(console.error);
