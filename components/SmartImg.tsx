import type { ImgHTMLAttributes } from "react";
import { imageSrcSet, optimizeImage } from "@/lib/imageUrl";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  src: string;
  /** Largest width (px) this image is shown at — used for the default src on Cloudinary images. */
  w?: number;
};

/**
 * <img> that serves Cloudinary photos in the best format/size for the device (AVIF/WebP, DPR-aware, responsive srcset)
 * and passes every other URL through unchanged.
 */
export default function SmartImg({ src, w = 800, alt = "", sizes = "(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw", loading = "lazy", ...rest }: Props) {
  const srcSet = imageSrcSet(src);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={optimizeImage(src, w)} srcSet={srcSet} sizes={srcSet ? sizes : undefined} alt={alt} loading={loading} decoding="async" {...rest} />;
}
