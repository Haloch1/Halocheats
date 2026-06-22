import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const authConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = authConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getAuthConfigMessage() {
  return "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to turn on sign up and sign in.";
}

export async function getCurrentSession() {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function getAccessToken() {
  const session = await getCurrentSession();
  return session?.access_token || null;
}
