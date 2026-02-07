import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yjqqfhlqksxhytbmnicr.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_QrSNS2qut5iOusIKlVtRfQ_9rVqRETE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;
