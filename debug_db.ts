
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
    const { data: svc, error: e1 } = await supabase.from('services').select('*').limit(1);
    const { data: prod, error: e2 } = await supabase.from('products').select('*').limit(1);
    const { data: inv, error: e3 } = await supabase.from('inventory_products').select('*').limit(1);

    if (e1) console.error("❌ ERROR accessing services:", e1);
    else console.log("✅ Success! services table is accessible.");

    if (e2) console.error("❌ ERROR accessing products:", e2);
    else console.log("✅ Success! products table is accessible.");

    if (e3) console.error("❌ ERROR accessing inventory_products:", e3);
    else console.log("✅ Success! inventory_products table is accessible.");
}

check();
