import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  }

  const db = getDb();
  await ensureSchema(db);

  try {
    await db.execute({
      sql: "INSERT INTO waitlist (email) VALUES (?)",
      args: [email.trim().toLowerCase()],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) {
      return NextResponse.json({ ok: true, already: true });
    }
    console.error("waitlist insert failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
