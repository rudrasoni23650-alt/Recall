require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // 1. Create a space
  const { data: spaces } = await supabaseAdmin.from('spaces').insert([
    {
      id: "test-space-1",
      user_id: "launch-core", // Not sure what user id they have, but let's see. Wait, I shouldn't insert without knowing user_id.
    }
  ]);
})();
