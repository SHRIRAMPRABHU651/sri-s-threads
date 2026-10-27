import { getSettings, saveSettings } from "@/lib/db";
import { cookies } from "next/headers";
import { COOKIE, verifySession } from "@/lib/auth";
import { fail, json, readJson, requireAdmin, str } from "@/lib/api";

const url = (v: unknown) => {
  const s = str(v, 300);
  return /^https?:\/\//i.test(s) ? s : "";
};

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  // The WhatsApp number is only returned to a logged-in admin (the storefront reads it server-side).
  if (await verifySession(cookies().get(COOKIE)?.value)) return json(s);
  const { whatsappNumber: _w, ...pub } = s;
  void _w;
  return json(pub);
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.");
  const whatsappNumber = String(body.whatsappNumber ?? "").replace(/\D/g, "");
  if (whatsappNumber.length < 10 || whatsappNumber.length > 15)
    return fail("Enter the WhatsApp number with country code, e.g. 919876543210.");
  return json(
    await saveSettings({
      storeName: str(body.storeName, 60) || "Sri's Threads",
      whatsappNumber,
      announcement: str(body.announcement, 200),
      instagramUrl: url(body.instagramUrl),
      facebookUrl: url(body.facebookUrl),
      twitterUrl: url(body.twitterUrl),
    }),
  );
}
