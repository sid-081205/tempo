import { createClient } from "@/lib/supabase/server";
import { DEMO_USER, isSupabaseConfigured } from "@/lib/supabase/config";

export interface AppUser {
  name: string;
  email: string;
  isDemo: boolean;
}

export async function getAppUser(): Promise<AppUser> {
  if (!isSupabaseConfigured) {
    return { ...DEMO_USER, isDemo: true };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ...DEMO_USER, isDemo: true };
  }

  const rawName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return { name, email: user.email ?? "", isDemo: false };
}
