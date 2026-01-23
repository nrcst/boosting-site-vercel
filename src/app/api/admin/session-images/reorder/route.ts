import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const sessionId = body?.session_id as string | undefined;
    const orderedIds = body?.image_ids as string[] | undefined;

    if (!sessionId || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "session_id and image_ids are required." },
        { status: 400 }
      );
    }

    if (mockDb.enabled()) {
      const ok = mockDb.reorderSessionImages(sessionId, orderedIds);
      if (!ok) {
        return NextResponse.json(
          { error: "Images not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    const supabase = getSupabaseAdminClient();
    for (const [index, id] of orderedIds.entries()) {
      const { error } = await supabase
        .from("session_images")
        .update({ order_index: index })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reorder images.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
