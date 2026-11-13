import { databaseConfigured, getDb } from "@/lib/db";
import { getMedia, isMediaId } from "@/lib/booking/native/media";

/**
 * GET /media/<id>/: a photo uploaded in the admin (src/lib/booking/native/media.ts). An id is never reused (a new upload
 * gets a new id), so browsers and the CDN may keep it for a year.
 */
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isMediaId(id) || !databaseConfigured()) return new Response("Not found", { status: 404 });
  const row = await getMedia(await getDb(), id);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.bytes), {
    headers: {
      "Content-Type": row.contentType,
      "Content-Length": String(row.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
