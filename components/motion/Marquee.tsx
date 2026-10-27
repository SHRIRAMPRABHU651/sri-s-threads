/** Infinite ticker. Pure CSS (compositor-only transform), pauses on hover, stops for reduced-motion users. */
export default function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <li key={`${t}-${i}`}><span className="marquee__dot" aria-hidden="true">✦</span>{t}</li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee ${className}`} role="presentation">
      <div className="marquee__track">{row(false)}{row(true)}</div>
    </div>
  );
}
