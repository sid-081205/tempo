import { NextResponse } from "next/server";
import type { ScheduleRequest } from "@/lib/types";
import { executeTool, getComposio, getConnectionStatuses } from "@/lib/composio";
import { formatTime, formatDayLabel } from "@/lib/format";

export async function POST(request: Request) {
  const { schedule } = (await request.json()) as { schedule?: ScheduleRequest };

  if (!schedule?.title || !schedule.day || schedule.startMin == null) {
    return NextResponse.json({ error: "Bad schedule request." }, { status: 400 });
  }

  if (!getComposio()) {
    return NextResponse.json(
      { error: "Composio isn't configured, so Tempo can't reach your calendar yet." },
      { status: 400 },
    );
  }

  const statuses = await getConnectionStatuses();
  if (statuses["googlecalendar"] !== "connected") {
    return NextResponse.json(
      { error: "Connect Google Calendar in Settings first, then try again." },
      { status: 409 },
    );
  }

  const h = Math.floor(schedule.startMin / 60);
  const m = schedule.startMin % 60;
  const startDatetime = `${schedule.day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  const durationH = Math.floor(schedule.durationMin / 60);
  const durationM = schedule.durationMin % 60;

  const args: Record<string, unknown> = {
    calendar_id: "primary",
    summary: schedule.title,
    description: "Scheduled by Tempo.",
    start_datetime: startDatetime,
    event_duration_hour: durationH,
    event_duration_minutes: durationM,
    timezone: "UTC",
  };
  if (schedule.attendeeEmails?.length) {
    args.attendees = schedule.attendeeEmails;
  }

  const result = await executeTool("GOOGLECALENDAR_CREATE_EVENT", args);

  if (!result.successful) {
    return NextResponse.json(
      { error: `Couldn't book it: ${result.error ?? "calendar said no"}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: `Booked: ${formatDayLabel(schedule.day)}, ${formatTime(schedule.startMin)}. It's on your Google Calendar.`,
  });
}
