import { eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { media, roomTypes } from "@/lib/db/schema";

/**
 * Photos uploaded in the admin, kept in the `media` table and served at /media/<id>/ (src/app/media/[id]/route.ts).
 * The admin shrinks a photo in the browser before upload; the server still checks what it receives.
 */

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const mediaUrl = (id: string) => `/media/${id}/`;

/** The media id inside an address made by mediaUrl, or null for any other address (e.g. a photo of the site). */
export function mediaIdFrom(url: string): string | null {
  const match = /^\/media\/([^/]+)\/?$/.exec(url);
  return match && ID.test(match[1]) ? match[1] : null;
}

export const isMediaId = (id: string) => ID.test(id);

/** The image type from the first bytes of the file, whatever name or type the browser gave it. */
export function sniffImage(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function saveMedia(db: Db, bytes: Buffer, contentType: string): Promise<string> {
  const [row] = await db.insert(media).values({ contentType, bytes, size: bytes.length }).returning({ id: media.id });
  return row.id;
}

export async function getMedia(db: Db, id: string) {
  if (!ID.test(id)) return null;
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

/** Deletes an uploaded photo once no room type shows it any more. Addresses of the site's own images are left alone. */
export async function deleteMediaIfUnused(db: Db, url: string) {
  const id = mediaIdFrom(url);
  if (!id) return;
  const [used] = await db
    .select({ id: roomTypes.id })
    .from(roomTypes)
    .where(sql`${roomTypes.photos} @> ${JSON.stringify([url])}::jsonb`)
    .limit(1);
  if (!used) await db.delete(media).where(eq(media.id, id));
}
