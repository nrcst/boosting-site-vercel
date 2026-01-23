import { NextResponse } from "next/server";
import { getSupabaseAnonClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";
import { orderIdSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = orderIdSchema.parse(body?.order_id);

    if (mockDb.enabled()) {
      const order = mockDb.getOrderByOrderId(orderId);
      if (!order) {
        return NextResponse.json(
          { error: "Order ID not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        order: {
          id: order.id,
          order_id: order.order_id,
          status: order.status,
        },
      });
    }

    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_id, status")
      .eq("order_id", orderId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Order ID not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
