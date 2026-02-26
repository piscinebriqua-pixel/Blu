
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function listTables() {
    // There is no easy way to list all tables with the public anon key if RLS is on 
    // and no tables are public. But usually we can try to guess from common names.
    const tables = ['clients', 'interventions', 'payments', 'pools', 'profiles', 'technicians', 'services', 'inventory_products', 'intervention_products', 'intervention_services'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`Table '${table}' might not exist: ${error.message}`);
        } else {
            console.log(`Table '${table}' exists.`);
        }
    }
}

listTables();
