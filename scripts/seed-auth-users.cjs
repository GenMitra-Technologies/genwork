// scripts/seed-auth-users.cjs
const { createClient } = require('@supabase/supabase-js');
const { getEnv } = require('./getEnv.cjs');

const env = getEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://jgjiakofetyiimtobhey.supabase.co';
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required in environment variables or .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = { supabase };
