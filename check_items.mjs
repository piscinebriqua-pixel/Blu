import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('devis_items').select('*').limit(1);
    if (error) console.log(error);
    else console.log(data.length ? Object.keys(data[0]) : "No rows");
}
run();
