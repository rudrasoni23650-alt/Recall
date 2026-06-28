require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await supabaseAdmin.from('memories').select('id, type, excerpt, summary, title, processing_status, processing_error').eq('id', '663b12d5-b406-4e51-a8cf-0e91334fb787');
  console.log(JSON.stringify(data, null, 2));
})();
