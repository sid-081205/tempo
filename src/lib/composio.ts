import { Composio } from "@composio/core";

let cached: Composio | null = null;

/** Server-side Composio client, or null when no API key is configured. */
export function getComposio(): Composio | null {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) return null;
  if (!cached) {
    cached = new Composio({ apiKey });
  }
  return cached;
}

/**
 * The Composio entity that owns the connected accounts.
 * Single-user for now; becomes the Supabase user id when we go multi-user.
 */
export function composioUserId(): string {
  return process.env.COMPOSIO_USER_ID ?? "tempo-user";
}

export type ConnectionStatus = "connected" | "pending" | "disconnected";

/** Map of toolkit slug -> connection status for our user. */
export async function getConnectionStatuses(): Promise<
  Record<string, ConnectionStatus>
> {
  const composio = getComposio();
  if (!composio) return {};

  const res = await composio.connectedAccounts.list({
    userIds: [composioUserId()],
  });

  const map: Record<string, ConnectionStatus> = {};
  for (const item of res.items ?? []) {
    const slug = item.toolkit?.slug?.toLowerCase();
    if (!slug) continue;
    const status =
      item.status === "ACTIVE"
        ? "connected"
        : item.status === "INITIATED" || item.status === "INITIALIZING"
          ? "pending"
          : "disconnected";
    // Prefer the strongest status if several accounts exist for a toolkit.
    if (map[slug] !== "connected") map[slug] = status;
  }
  return map;
}
