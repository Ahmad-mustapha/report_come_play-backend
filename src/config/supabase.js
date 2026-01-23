import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (supabaseUrl) {
    const hostname = new URL(supabaseUrl).hostname;
    dns.lookup(hostname, (err, address) => {
        if (err) {
            console.error(`❌ DNS Lookup failed for ${hostname}:`, err.message);
            console.error('This is likely a network/DNS issue on your computer.');
        } else {
            console.log(`✅ Supabase DNS Resolved: ${hostname} -> ${address}`);
        }
    });
}

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL or Anon Key missing in .env. Image uploads might fail.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
