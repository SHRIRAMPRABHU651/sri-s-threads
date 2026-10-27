/**
 * Client-safe image URL helpers.
 * Cloudinary URLs get on-the-fly optimisation (modern format, auto quality, width-limited);
 * every other URL (local assets, MongoDB-stored fallback images) passes through untouched.
 */
const CLD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

export const isCloudinaryUrl = (url: string) => CLD.test(url);

export function optimizeImage(url: string, width?: number): string {
  const m = CLD.exec(url);
  if (!m) return url;
  const t = ["f_auto", "q_auto", "dpr_auto", ...(width ? [`c_limit`, `w_${width}`] : [])].join(",");
  return `${m[1]}${t}/${m[2]}`;
}

const WIDTHS = [240, 360, 480, 640, 800, 1080, 1440];

/** srcset for Cloudinary images; undefined for everything else. */
export function imageSrcSet(url: string): string | undefined {
  if (!isCloudinaryUrl(url)) return undefined;
  return WIDTHS.map((w) => `${optimizeImage(url, w)} ${w}w`).join(", ");
}
