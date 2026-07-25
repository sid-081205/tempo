export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * When Supabase env vars are absent the app runs in demo mode:
 * no auth wall, a stand-in user, everything else fully functional.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const DEMO_USER = {
  name: "Sid",
  email: "demo@tempo.health",
};
