import { NextResponse } from "next/server";
import { getSupabaseAnonClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";
import { orderIdSchema } from "@/lib/validators";
import type { SessionImageRecord } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = orderIdSchema.parse(id);
    if (mockDb.enabled()) {
      const order = mockDb.getOrderDetails(orderId);
      if (!order) {
        return NextResponse.json(
          { error: "Order not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({ order });
    }

    const supabase = getSupabaseAnonClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const { data: sessions, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("order_id", order.id)
      .order("session_date", { ascending: false });

    if (sessionError) {
      return NextResponse.json(
        { error: "Unable to load sessions." },
        { status: 500 }
      );
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

    return NextResponse.json({
      order: {
        ...order,
        sessions: formattedSessions,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
