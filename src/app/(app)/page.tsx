import {
  getHeartWindow,
  getPendingInvite,
  getTodayStory,
  metricsForLastDays,
  todayUtc,
  dayKey,
} from "@/lib/mock";
import { formatDayLabelFull } from "@/lib/format";
import { getAppUser } from "@/lib/user";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAppUser();

  const windows = {
    "6h": getHeartWindow("6h"),
    "24h": getHeartWindow("24h"),
    "7d": getHeartWindow("7d"),
  };
  const metrics = metricsForLastDays(14);
  const invite = getPendingInvite();
  const story = getTodayStory();

  const hour = new Date().getUTCHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardClient
      greeting={`${greeting}, ${user.name}.`}
      dateLabel={formatDayLabelFull(dayKey(todayUtc()))}
      story={story}
      windows={windows}
      metrics={metrics}
      invite={invite}
    />
  );
}
