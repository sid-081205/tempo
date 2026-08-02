import { getAppUser } from "@/lib/user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getAppUser();

  return (
    <SettingsClient
      name={user.name}
      email={user.email}
      authEnabled={isSupabaseConfigured}
    />
  );
}
