
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log("Checking 'technicians' columns...");
    const { data: techData, error: techError } = await supabase.from('technicians').select('*').limit(1);
    if (techError) {
        console.error("Error fetching technicians:", techError);
    } else if (techData.length > 0) {
        console.log("Technicians columns:", Object.keys(techData[0]));
    } else {
        console.log("Technicians table is empty, cannot infer columns.");
    }

    console.log("\nChecking 'profiles' table...");
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').limit(1);
    if (profileError) {
        console.log("Profiles table likely does not exist or error:", profileError.message);
    } else {
        console.log("Profiles table exists. Columns:", profileData.length > 0 ? Object.keys(profileData[0]) : "Empty table");
    }

    console.log("\nChecking 'clients' columns...");
    const { data: clientData, error: clientError } = await supabase.from('clients').select('*').limit(1);
    if (clientData && clientData.length > 0) {
        console.log("Clients columns:", Object.keys(clientData[0]));
    }
}

checkSchema();
