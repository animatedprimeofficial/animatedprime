import { NextResponse } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Waitlist capture for the Android build. There is no backend in this project,
 * so submissions are validated here and logged server-side; swap the log for
 * your CRM / mailing-list call when you wire one up.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const email =
    typeof payload === "object" && payload !== null && "email" in payload
      ? String((payload as { email: unknown }).email ?? "").trim()
      : "";
  const platform =
    typeof payload === "object" && payload !== null && "platform" in payload
      ? String((payload as { platform: unknown }).platform ?? "android")
      : "android";

  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json(
      { ok: false, error: "That email address does not look right." },
      { status: 422 },
    );
  }

  // Replace with your mailing-list provider. Never log PII in production.
  console.info(`[animatedprime] android waitlist: ${email} (${platform})`);

  return NextResponse.json({ ok: true, message: "You are on the list." });
}
