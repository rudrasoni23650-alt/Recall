require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data: spaces } = await supabaseAdmin.from('spaces').select('*');
  console.log('Spaces in DB:', JSON.stringify(spaces, null, 2));
})();
