import { getImage } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Serves images stored in MongoDB. Ids are random and never reused, so they can be cached forever. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!/^img_[a-z0-9]+$/.test(params.id)) return new Response("Not found", { status: 404 });
  const etag = `"${params.id}"`;
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
  const img = await getImage(params.id);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
