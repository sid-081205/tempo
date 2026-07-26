import { NextResponse } from "next/server";
import {
  composioUserId,
  getComposio,
  getConnectionStatuses,
} from "@/lib/composio";
import { CONNECTORS } from "@/lib/connectors";

export async function GET() {
  const composio = getComposio();
  if (!composio) {
    return NextResponse.json({ enabled: false, statuses: {} });
  }
  try {
    const statuses = await getConnectionStatuses();
    return NextResponse.json({ enabled: true, statuses });
  } catch (err) {
    return NextResponse.json(
      { enabled: true, statuses: {}, error: String(err) },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const composio = getComposio();
  if (!composio) {
    return NextResponse.json(
      { error: "Composio isn't configured. Set COMPOSIO_API_KEY." },
      { status: 400 },
    );
  }

  const { connectorId } = (await request.json()) as { connectorId?: string };
  const connector = CONNECTORS.find((c) => c.id === connectorId);

  if (!connector) {
    return NextResponse.json({ error: "Unknown connector." }, { status: 400 });
  }
  if (!connector.toolkit) {
    return NextResponse.json(
      { error: `${connector.name} isn't connectable yet.` },
      { status: 400 },
    );
  }

  try {
    // Prefer the non-deprecated link() flow when an auth config already
    // exists; authorize() creates one (Composio managed) on first use.
    const configs = await composio.authConfigs.list({
      toolkit: connector.toolkit,
    });
    const existing = configs.items?.[0];

    const connectionRequest = existing
      ? await composio.connectedAccounts.link(composioUserId(), existing.id)
      : await composio.toolkits.authorize(composioUserId(), connector.toolkit);

    return NextResponse.json({ redirectUrl: connectionRequest.redirectUrl });
  } catch (err) {
    const message = String(err);
    if (message.includes("InsufficientPermissions") || message.includes("permissions required")) {
      return NextResponse.json(
        {
          error:
            "Your Composio API key is read-only. Create a key with write access at app.composio.dev (Settings, API Keys), update COMPOSIO_API_KEY, and restart.",
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: `Couldn't start the ${connector.name} connection: ${message}` },
      { status: 502 },
    );
  }
}
