const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// We try to load dotenv explicitly for raw debugging tests outside express
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY inside .env!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
