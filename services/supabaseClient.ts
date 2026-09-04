import { createClient } from '@supabase/supabase-js';

// Közös iskolai "Fizika Pontkövető" Supabase projekt.
// A diákok ezen a közös Supabase Auth-on lépnek be (e-mail + jelszó), a pontokat a
// app_whoami / app_submit_score RPC-k kezelik. Lásd: services/api.ts + INTEGRATION.md.
const SUPABASE_URL = 'https://zmzjnqvsywizojqoewus.supabase.co';
// A publishable ("anon") kulcs szándékosan publikus. .env-ből felülírható a VITE_SUPABASE_KEY-vel.
// @ts-ignore
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || 'sb_publishable__3LQKcB2Zli37v72Ve4rDg_F0S9L3vr';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
