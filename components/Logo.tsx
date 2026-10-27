import type { CSSProperties } from "react";

const TEAL = "#0f5a5c";
const GOLD = "#b8975a";
const CREAM = "#f6f1e4";

/** Leaf shape pointing along +x, ~20 long. */
const LEAF = "M0 0 C5 -7 14 -7 20 0 C14 7 5 7 0 0Z";

type EmblemProps = { size?: number | string; animate?: boolean; className?: string; style?: CSSProperties; title?: string };

/**
 * Sri's Threads emblem: a draped saree forming an "S", wrapped by leaves, flowers and a paisley.
 * Pure SVG so it stays crisp at any size. `animate` draws the strokes in (used by the loader).
 */
export function Emblem({ size = 48, animate = false, className, style, title }: EmblemProps) {
  const draw = animate ? { pathLength: 1, className: "draw" } : {};
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* pleated pallu fan */}
      <g className={animate ? "fade fade-2" : undefined}>
        <path d="M120 126 C142 132 153 150 150 170 C130 180 100 180 80 172 C106 166 118 150 120 126Z" fill={CREAM} stroke={TEAL} strokeWidth="2.5" />
        <path d="M122 134 C122 154 112 168 96 176 M128 136 C134 152 128 168 116 178 M135 140 C144 154 138 170 130 178 M142 146 C150 158 146 170 142 176" stroke={TEAL} strokeWidth="1.4" opacity=".75" />
        <path d="M80 172 C100 180 130 180 150 170" stroke={GOLD} strokeWidth="4" strokeDasharray="1 5" />
      </g>

      {/* second drape strand */}
      <path d="M102 32 C72 48 100 72 112 92 C124 114 116 138 92 152" stroke={TEAL} strokeWidth="13" {...draw} />
      <path d="M102 32 C72 48 100 72 112 92 C124 114 116 138 92 152" stroke={CREAM} strokeWidth="8" />
      <path d="M102 32 C72 48 100 72 112 92 C124 114 116 138 92 152" stroke={GOLD} strokeWidth="2.2" strokeDasharray="1 5" />

      {/* main S ribbon */}
      <path d="M130 24 C100 14 76 38 84 62 C92 88 130 98 125 128 C121 154 92 170 68 158" stroke={TEAL} strokeWidth="15" {...draw} />
      <path d="M130 24 C100 14 76 38 84 62 C92 88 130 98 125 128 C121 154 92 170 68 158" stroke={CREAM} strokeWidth="9.5" />
      <path d="M130 24 C100 14 76 38 84 62 C92 88 130 98 125 128 C121 154 92 170 68 158" stroke={GOLD} strokeWidth="2.6" strokeDasharray="1 5.5" />

      {/* vine + leaves (left) */}
      <g className={animate ? "fade fade-3" : undefined}>
        <path d="M38 118 C34 88 46 56 72 34" stroke={TEAL} strokeWidth="2" />
        <path d={LEAF} transform="translate(36 100) rotate(-120)" fill={TEAL} />
        <path d={LEAF} transform="translate(36 100) rotate(-35)" fill={GOLD} />
        <path d={LEAF} transform="translate(38 78) rotate(-130)" fill={GOLD} />
        <path d={LEAF} transform="translate(40 78) rotate(-25)" fill={TEAL} />
        <path d={LEAF} transform="translate(50 56) rotate(-140)" fill={TEAL} />
        <path d={LEAF} transform="translate(52 56) rotate(-20)" fill={GOLD} />
        <path d={LEAF} transform="translate(64 40) rotate(-60)" fill={TEAL} />
      </g>

      {/* flower (bottom-left) */}
      <g transform="translate(40 132)" className={animate ? "fade fade-4" : undefined}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-9" rx="5.5" ry="9" fill={GOLD} transform={`rotate(${a})`} />
        ))}
        <circle r="4.5" fill={TEAL} />
        <path d={LEAF} transform="translate(4 12) rotate(70) scale(.8)" fill={TEAL} />
      </g>

      {/* paisley */}
      <g className={animate ? "fade fade-4" : undefined} transform="translate(74 172) rotate(-25) scale(.95)">
        <path d="M0 -15 C11 -15 17 -6 15 4 C13 14 3 19 -6 15 C-15 11 -13 0 -5 -3 C1 -5 6 -1 4 5" stroke={GOLD} strokeWidth="2.4" />
        <circle cx="1" cy="9" r="2.4" fill={TEAL} />
      </g>

      {/* small flower + leaves (top-right) */}
      <g className={animate ? "fade fade-4" : undefined}>
        <g transform="translate(168 40)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-6" rx="3.6" ry="6.4" fill={CREAM} stroke={TEAL} strokeWidth="1.5" transform={`rotate(${a})`} />
          ))}
          <circle r="2.8" fill={GOLD} />
        </g>
        <path d="M166 50 C160 62 156 72 150 82" stroke={TEAL} strokeWidth="1.8" />
        <path d={LEAF} transform="translate(162 58) rotate(15) scale(.75)" fill={GOLD} />
        <path d={LEAF} transform="translate(159 66) rotate(165) scale(.75)" fill={TEAL} />
        <path d={LEAF} transform="translate(154 76) rotate(20) scale(.7)" fill={TEAL} />
      </g>
    </svg>
  );
}

type WordmarkProps = { height?: number; light?: boolean; className?: string };

/** Emblem + "SRI'S THREADS" set in Cinzel — used in the header and drawer. */
export function Wordmark({ height = 36, light = false, className }: WordmarkProps) {
  return (
    <span className={`wordmark${className ? ` ${className}` : ""}`} style={{ ["--wm-h" as string]: `${height}px` }}>
      <Emblem size={height} />
      <span className="wordmark__text" style={light ? { color: "#fff" } : undefined}>
        SRI&rsquo;S THREADS
      </span>
    </span>
  );
}

/** Stacked full logo with tagline (loader, footer). */
export function LogoStacked({ animate = false, light = false }: { animate?: boolean; light?: boolean }) {
  return (
    <div className="logo-stacked">
      <Emblem size={animate ? 150 : 120} animate={animate} title="Sri's Threads" />
      <div className={`logo-stacked__name${animate ? " fade fade-5" : ""}`} style={light ? { color: "#fff" } : undefined}>
        SRI&rsquo;S THREADS
      </div>
      <div className={`logo-stacked__rule${animate ? " fade fade-5" : ""}`} aria-hidden="true">
        <i />
        <b />
        <i />
      </div>
      <div className={`logo-stacked__tag${animate ? " fade fade-6" : ""}`}>TRADITIONAL | ETHNIC | ELEGANT</div>
    </div>
  );
}
