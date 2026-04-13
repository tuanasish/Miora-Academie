const { createClient } = require("@supabase/supabase-js");

async function testOtp() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);
  
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: "mioraacademie@gmail.com",
  });
  
  console.log("Error:", error);
  console.log("Data:", data);
}
testOtp();
