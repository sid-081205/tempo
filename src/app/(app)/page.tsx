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
import { withTimeout } from "@/lib/fast";
import { formatDayLabelFull } from "@/lib/format";
import { getAppUser } from "@/lib/user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PulseClient } from "./PulseClient";

export const dynamic = "force-dynamic";

export default async function PulsePage() {
  // Auth + live overlay in parallel; live sources hard-capped so navigation
  // never waits on Gmail/OpenAI/Composio.
  const [user, live] = await Promise.all([
    getAppUser(),
    withTimeout(
      getLiveEvents(addDays(todayUtc(), -7), 9),
      900,
      { events: [], live: [] as ("google" | "gmail")[] },
    ),
  ]);

  const liveEvents = live.events;
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
