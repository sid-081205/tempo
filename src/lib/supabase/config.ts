export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Auth is available when Supabase public keys are present. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Stand-in identity when auth isn't configured or no session exists yet. */
export const LOCAL_USER = {
  name: "You",
  email: "",
};
