import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";
import { updateSessionSchema } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = updateSessionSchema.parse(body);

    if (mockDb.enabled()) {
      const updated = mockDb.updateSession(id, {
        session_date: payload.session_date,
        summary: payload.summary ?? null,
      });
      if (!updated) {
        return NextResponse.json(
          { error: "Session not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ session: updated });
    }

    const supabase = getSupabaseAdminClient();
    const { data: session, error } = await supabase
      .from("sessions")
      .update({
        session_date: payload.session_date,
        summary: payload.summary ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: error?.message ?? "Session not found." },
        { status: 400 }
      );
    }

    if (payload.images?.length) {
      const validImages = payload.images.filter(
        (image) => typeof image.image_url === "string" && image.image_url.length
      );
      if (!validImages.length) {
        return NextResponse.json({ session });
      }
      const { data: existingImages } = await supabase
        .from("session_images")
        .select("*")
        .eq("session_id", id)
        .order("order_index", { ascending: false })
        .limit(1);

      const baseIndex = existingImages?.[0]?.order_index ?? -1;
      const imagesPayload = validImages.map((image, index) => ({
        session_id: id,
        image_url: image.image_url,
        order_index: baseIndex + 1 + index,
      }));

      const { error: imagesError } = await supabase
        .from("session_images")
        .insert(imagesPayload);

      if (imagesError) {
        return NextResponse.json(
          { error: imagesError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (mockDb.enabled()) {
      const deleted = mockDb.deleteSession(id);
      if (!deleted) {
        return NextResponse.json(
          { error: "Session not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("sessions").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
