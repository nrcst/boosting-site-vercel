import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";
import { createOrderSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = createOrderSchema.parse(body);

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
      const order = mockDb.createOrder({
        ...sanitized,
        status: sanitized.status,
      });
      return NextResponse.json({ order });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .insert(sanitized)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
