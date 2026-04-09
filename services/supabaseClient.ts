import { createClient } from '@supabase/supabase-js';

// Supabase konfiguráció
// FIGYELEM: A "VITE_SUPABASE_KEY" helyére illeszd be az 'anon' key-t a Supabase Project Settings > API menüből, 
// ha nem használsz .env fájlt.
const SUPABASE_URL = 'https://zmzjnqvsywizojqoewus.supabase.co';
// @ts-ignore
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || 'sb_publishable__3LQKcB2Zli37v72Ve4rDg_F0S9L3vr';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);