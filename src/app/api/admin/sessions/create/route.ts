import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";
import { createSessionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = createSessionSchema.parse(body);

    if (mockDb.enabled()) {
      const session = mockDb.createSession(payload.order_id, {
        session_date: payload.session_date,
        summary: payload.summary || null,
        images: payload.images?.map((image) => image.image_url),
      });
      if (!session) {
        return NextResponse.json(
          { error: "Order not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ session });
    }

    const supabase = getSupabaseAdminClient();
    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        order_id: payload.order_id,
        session_date: payload.session_date,
        summary: payload.summary || null,
      })
      .select("*")
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: error?.message ?? "Unable to create session." },
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
      const { error: imagesError } = await supabase
        .from("session_images")
        .insert(
          validImages.map((image) => ({
            session_id: session.id,
            image_url: image.image_url,
            order_index: image.order_index,
          }))
        );

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
      error instanceof Error ? error.message : "Unable to create session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
