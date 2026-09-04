import { createClient } from '@supabase/supabase-js';
import'dotenv/config';

// Use the service_role key here (backend only, never exposed to the frontend)
// so the Express API can bypass RLS and do its own auth/role checks.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabase;
