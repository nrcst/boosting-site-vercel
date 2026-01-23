import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db";
import { mockDb } from "@/lib/mock-data";

export async function POST(request: Request) {
  try {
    if (mockDb.enabled()) {
      return NextResponse.json({ url: "/placeholder.svg" });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const orderId = formData.get("orderId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const bucket =
      process.env.SUPABASE_STORAGE_BUCKET ?? "order-images";

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
    const folder = typeof orderId === "string" ? orderId : "misc";

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(`orders/${folder}/${fileName}`, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(`orders/${folder}/${fileName}`);

    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
