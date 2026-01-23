import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";
import { updateOrderSchema } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = updateOrderSchema.parse(body);

    const sanitized = {
      ...payload,
      ign: payload.ign || null,
      customer_name: payload.customer_name || null,
      uid: payload.uid || null,
      game_type: payload.game_type || null,
      service_type: payload.service_type || null,
      start_date: payload.start_date || null,
      due_date: payload.due_date || null,
      profile_screenshot_url: payload.profile_screenshot_url || null,
    };

    if (mockDb.enabled()) {
      const order = mockDb.updateOrder(id, sanitized);
      if (!order) {
        return NextResponse.json(
          { error: "Order not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ order });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .update(sanitized)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Order not found." },
        { status: 400 }
      );
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (mockDb.enabled()) {
      const deleted = mockDb.deleteOrder(id);
      if (!deleted) {
        return NextResponse.json(
          { error: "Order not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Unable to delete order." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
