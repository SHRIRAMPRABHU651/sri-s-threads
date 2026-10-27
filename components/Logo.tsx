/* Brand artwork — the real Sri's Threads logo (files in /public: logo-full, logo-emblem, logo-lockup). */

type ImgProps = { className?: string; style?: React.CSSProperties };

/** Just the circular saree-"S" emblem. */
export function Emblem({ size = 48, title, className, style }: { size?: number; title?: string } & ImgProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-emblem.webp" width={size} height={size} alt={title ?? ""} aria-hidden={title ? undefined : true} className={className} style={{ width: size, height: size, ...style }} />
  );
}

/** Emblem + "Sri's Threads" on one line — used in the header, menu drawer and footer art. */
export function Wordmark({ height = 36, className }: { height?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-lockup.webp"
      alt="Sri's Threads"
      width={Math.round((height * 1006) / 278)}
      height={height}
      className={`wordmark${className ? ` ${className}` : ""}`}
      style={{ ["--wm-h" as string]: `${height}px` }}
    />
  );
}

/** Full logo with tagline (loader, login). `animate` plays the entrance animation. */
export function LogoStacked({ animate = false, width = 300 }: { animate?: boolean; width?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-full.webp"
      alt="Sri's Threads — Traditional | Ethnic | Elegant"
      width={width}
      height={Math.round((width * 438) / 532)}
      className={`logo-full${animate ? " logo-full--in" : ""}`}
      style={{ width, height: "auto", maxWidth: "80vw" }}
    />
  );
}
