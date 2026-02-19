
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
});

async function check() {
    console.log("Testing connection to 'profiles'...");
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error("❌ ERROR accessing profiles:", error);
        console.log("Suggestion: Run 'reset_profiles_table.sql' in Supabase SQL Editor.");
    } else {
        console.log("✅ Success! Profiles table is accessible.");
        console.log("Data sample:", data);
    }
}

check();
