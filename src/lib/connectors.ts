export interface Connector {
  id: string;
  name: string;
  detail: string;
  kind: "context" | "health";
  /** Composio toolkit slug, or null when no integration exists yet. */
  toolkit: string | null;
  primary?: boolean;
}

export const CONNECTORS: Connector[] = [
  // Life context (MCP tools via Composio)
  {
    id: "googlecalendar",
    name: "Google Calendar",
    detail: "Events, invites, attendees",
    kind: "context",
    toolkit: "googlecalendar",
    primary: true,
  },
  {
    id: "gmail",
    name: "Gmail",
    detail: "Communication load and tone",
    kind: "context",
    toolkit: "gmail",
  },
  {
    id: "slack",
    name: "Slack",
    detail: "Pings, after-hours activity",
    kind: "context",
    toolkit: "slack",
  },
  {
    id: "notion",
    name: "Notion",
    detail: "Open loops and pending pressure",
    kind: "context",
    toolkit: "notion",
  },
  // Health state
  {
    id: "applehealth",
    name: "Apple Health",
    detail: "Primary source, syncs from the iOS app",
    kind: "health",
    toolkit: null,
    primary: true,
  },
  {
    id: "whoop",
    name: "WHOOP",
    detail: "Strain, recovery, journals",
    kind: "health",
    toolkit: "whoop",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    detail: "Steps, heart rate, sleep",
    kind: "health",
    toolkit: "fitbit",
  },
  {
    id: "strava",
    name: "Strava",
    detail: "Workouts, GPS activities",
    kind: "health",
    toolkit: "strava",
  },
  {
    id: "oura",
    name: "Oura",
    detail: "Sleep staging, readiness",
    kind: "health",
    toolkit: null,
  },
  {
    id: "flo",
    name: "Flo",
    detail: "Cycle tracking",
    kind: "health",
    toolkit: null,
  },
];
