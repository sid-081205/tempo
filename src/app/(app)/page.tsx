import {
  getPulseWindow,
  getTodayStory,
  getWorkouts,
  metricsForLastDays,
  todayUtc,
  dayKey,
} from "@/lib/mock";
import { formatDayLabelFull } from "@/lib/format";
import { getAppUser } from "@/lib/user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PulseClient } from "./PulseClient";

export const dynamic = "force-dynamic";

export default async function PulsePage() {
  const user = await getAppUser();

  const windows = {
    "6h": getPulseWindow("6h"),
    "24h": getPulseWindow("24h"),
    "7d": getPulseWindow("7d"),
  };
  const metrics = metricsForLastDays(14);
  const workouts = getWorkouts(14);
  const story = getTodayStory();

  const hour = new Date().getUTCHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <PulseClient
      greeting={`${greeting}, ${user.name}.`}
      dateLabel={formatDayLabelFull(dayKey(todayUtc()))}
      story={story}
      windows={windows}
      metrics={metrics}
      workouts={workouts}
      authEnabled={isSupabaseConfigured}
    />
  );
}
