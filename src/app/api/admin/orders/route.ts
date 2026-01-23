import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";

export async function GET() {
  try {
    if (mockDb.enabled()) {
      return NextResponse.json({ orders: mockDb.listOrders() });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ orders: data ?? [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load orders.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
