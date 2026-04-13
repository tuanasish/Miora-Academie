import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createAdmin() {
  const email = "onecrusha@gmail.com";
  
  // 1. Create user in GoTrue (auth.users)
  const { data: adminUser, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (createUserError) {
    if (createUserError.message.includes("already exists")) {
      console.log(`User ${email} already exists in auth.users.`);
    } else {
      console.error("Failed to create auth user:", createUserError);
      process.exit(1);
    }
  }

  // Fetch the user ID (whether just created or already existed)
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error(`Could not find user ${email} after creation.`);
    process.exit(1);
  }

  // 2. Insert or update in public.profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: email,
      role: "admin",
      status: "active",
      full_name: "Admin OneCrusha",
    }, {onConflict: 'id'});

  if (profileError) {
    console.error("Failed to create profile:", profileError);
    process.exit(1);
  }

  console.log(`Successfully created admin user: ${email} with ID: ${user.id}`);
}

createAdmin();
