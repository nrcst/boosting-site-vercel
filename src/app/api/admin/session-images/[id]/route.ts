import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (mockDb.enabled()) {
      const deleted = mockDb.deleteSessionImage(id);
      if (!deleted) {
        return NextResponse.json(
          { error: "Image not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("session_images")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
