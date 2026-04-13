const { createClient } = require("@supabase/supabase-js");

async function testOtp() {
  const response = await fetch("http://localhost:3000/api/auth/request-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vuanhtuanofc@gmail.com", redirectTo: "http://localhost:3000/login" }),
  });
  console.log("Status:", response.status);
  console.log("Set-Cookie headers:", response.headers.get("set-cookie"));
  const payload = await response.json();
  console.log("Payload:", payload);
}
testOtp();
