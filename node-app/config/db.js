const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// We try to load dotenv explicitly for raw debugging tests outside express
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn("⚠️ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables in Vercel!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
