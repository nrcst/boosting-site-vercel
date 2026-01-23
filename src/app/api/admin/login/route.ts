import { NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validators";
import { createAdminToken, setAdminCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = adminLoginSchema.parse(body);

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 401 }
      );
    }

    const token = await createAdminToken(password);
    await setAdminCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to login.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
