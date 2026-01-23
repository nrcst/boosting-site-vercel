import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";
import { adminOrderIdSchema } from "@/lib/validators";
import type { SessionImageRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required." },
        { status: 400 }
      );
    }

    if (mockDb.enabled()) {
      return NextResponse.json({
        sessions: mockDb.listSessionsByOrderId(orderId),
      });
    }

    adminOrderIdSchema.parse(orderId);

    const supabase = getSupabaseAdminClient();
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("order_id", orderId)
      .order("session_date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const sessionIds = sessions?.map((session) => session.id) ?? [];
    const sessionImages: SessionImageRecord[] = sessionIds.length
      ? (
          (
            await supabase
              .from("session_images")
              .select("*")
              .in("session_id", sessionIds)
              .order("order_index", { ascending: true })
          ).data ?? []
        )
      : [];

    const imagesBySession = new Map<string, SessionImageRecord[]>();
    sessionImages.forEach((image) => {
      const list = imagesBySession.get(image.session_id) ?? [];
      list.push(image);
      imagesBySession.set(image.session_id, list);
    });

    const formattedSessions = (sessions ?? []).map((session) => ({
      ...session,
      images: imagesBySession.get(session.id) ?? [],
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load sessions.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
