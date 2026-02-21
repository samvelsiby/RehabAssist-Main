import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://onjxotcgnlnijewlkjkc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TEbfbsh3B6R2mNjqmrKLzw_7MEMSTZO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
