import {
  addDays,
  getPulseWindow,
  getTodayStory,
  getWorkouts,
  metricsForLastDays,
  todayUtc,
  dayKey,
} from "@/lib/mock";
import { getLiveEvents } from "@/lib/calendar";
import { formatDayLabelFull } from "@/lib/format";
import { getAppUser } from "@/lib/user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PulseClient } from "./PulseClient";

export const dynamic = "force-dynamic";

export default async function PulsePage() {
  const user = await getAppUser();

  // Real events (Google Calendar + Gmail proposals) overlay the graphs.
  const { events: liveEvents } = await getLiveEvents(
    addDays(todayUtc(), -7),
    9,
  );

  const windows = {
    "6h": getPulseWindow("6h", liveEvents),
    "24h": getPulseWindow("24h", liveEvents),
    "7d": getPulseWindow("7d", liveEvents),
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
