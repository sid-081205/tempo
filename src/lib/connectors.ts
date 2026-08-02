export interface Connector {
  id: string;
  name: string;
  detail: string;
  kind: "context" | "health";
  /**
   * How this connector authenticates:
   * - composio: OAuth via Composio
   * - healthkit: native Apple Health bridge (iOS)
   * - eventkit: native Apple Calendar bridge (iOS)
   * - soon: listed, not yet wireable
   */
  provider: "composio" | "healthkit" | "eventkit" | "soon";
  /** Composio toolkit slug when provider === "composio". */
  toolkit: string | null;
  primary?: boolean;
  /** Prefer showing this on iOS / in the native shell. */
  iosNative?: boolean;
}

export const CONNECTORS: Connector[] = [
  // Life context
  {
    id: "applecalendar",
    name: "Apple Calendar",
    detail: "Events from the Calendar app on this iPhone",
    kind: "context",
    provider: "eventkit",
    toolkit: null,
    iosNative: true,
  },
  {
    id: "googlecalendar",
    name: "Google Calendar",
    detail: "Events, invites, attendees",
    kind: "context",
    provider: "composio",
    toolkit: "googlecalendar",
    primary: true,
  },
  {
    id: "gmail",
    name: "Gmail",
    detail: "Communication load and tone",
    kind: "context",
    provider: "composio",
    toolkit: "gmail",
  },
  {
    id: "slack",
    name: "Slack",
    detail: "Pings, after-hours activity",
    kind: "context",
    provider: "composio",
    toolkit: "slack",
  },
  {
    id: "notion",
    name: "Notion",
    detail: "Open loops and pending pressure",
    kind: "context",
    provider: "composio",
    toolkit: "notion",
  },
  // Health state
  {
    id: "applehealth",
    name: "Apple Health",
    detail: "Heart rate, HRV, sleep, workouts — primary on iPhone",
    kind: "health",
    provider: "healthkit",
    toolkit: null,
    primary: true,
    iosNative: true,
  },
  {
    id: "whoop",
    name: "WHOOP",
    detail: "Strain, recovery, journals",
    kind: "health",
    provider: "composio",
    toolkit: "whoop",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    detail: "Steps, heart rate, sleep",
    kind: "health",
    provider: "composio",
    toolkit: "fitbit",
  },
  {
    id: "strava",
    name: "Strava",
    detail: "Workouts, GPS activities",
    kind: "health",
    provider: "composio",
    toolkit: "strava",
  },
  {
    id: "oura",
    name: "Oura",
    detail: "Sleep staging, readiness",
    kind: "health",
    provider: "composio",
    toolkit: "oura",
  },
  {
    id: "flo",
    name: "Flo",
    detail: "Cycle tracking",
    kind: "health",
    provider: "soon",
    toolkit: null,
  },
];
