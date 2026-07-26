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

/**
 * Delete connected accounts for a toolkit. With `staleOnly`, only removes
 * expired/failed ones (used before re-linking).
 */
export async function deleteToolkitAccounts(
  toolkit: string,
  { staleOnly = false }: { staleOnly?: boolean } = {},
): Promise<number> {
  const composio = getComposio();
  if (!composio) return 0;

  const res = await composio.connectedAccounts.list({
    userIds: [composioUserId()],
  });
  let deleted = 0;
  for (const item of res.items ?? []) {
    if (item.toolkit?.slug?.toLowerCase() !== toolkit) continue;
    if (staleOnly && (item.status === "ACTIVE" || item.status === "INITIATED")) {
      continue;
    }
    try {
      await composio.connectedAccounts.delete(item.id);
      deleted++;
    } catch {
      // Best effort; a failed delete shouldn't block the rest.
    }
  }
  return deleted;
}

/** Execute a Composio tool for our user, with version pinning handled. */
export async function executeTool(
  slug: string,
  args: Record<string, unknown>,
): Promise<{ successful: boolean; data: unknown; error?: string | null }> {
  const composio = getComposio();
  if (!composio) {
    return { successful: false, data: null, error: "Composio not configured" };
  }
  const result = await composio.tools.execute(slug, {
    userId: composioUserId(),
    version: "latest",
    dangerouslySkipVersionCheck: true,
    arguments: args,
  });
  return {
    successful: result.successful,
    data: result.data,
    error: result.error,
  };
}
