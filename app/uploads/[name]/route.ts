import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

/** Serves admin-uploaded product images (they live outside /public so they work after build). */
export async function GET(_: Request, { params }: { params: { name: string } }) {
  const m = /^[\w-]+\.(jpg|png|webp|gif)$/.exec(params.name);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const file = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "uploads", params.name);
    const buf = await fs.readFile(file);
    return new Response(buf, { headers: { "Content-Type": MIME[m[1]], "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
