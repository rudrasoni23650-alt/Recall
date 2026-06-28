require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const DEMO_IDS = ["launch-narrative-space", "privacy-patterns-space", "ideas-worth-returning-space"];

async function run() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  
  for (const user of users) {
    const spaces = user.user_metadata?.spaces || [];
    const filteredSpaces = spaces.filter(s => !DEMO_IDS.includes(s.id));
    
    if (spaces.length !== filteredSpaces.length) {
      console.log(`Cleaning up spaces for user ${user.email}...`);
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, spaces: filteredSpaces }
      });
    }
  }
  console.log("Cleanup complete!");
}

run();
