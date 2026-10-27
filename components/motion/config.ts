/** Shared motion tokens so every animation on the site feels like one system. */
export const EASE = [0.22, 1, 0.36, 1] as const; // easeOutQuint-style: fast start, long soft landing
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const DUR = { fast: 0.35, base: 0.7, slow: 1.0 } as const;
export const STAGGER = 0.08;
/** Fire when ~15% of the element is visible, slightly before it reaches the bottom edge. */
export const VIEWPORT = { once: true, amount: 0.15, margin: "0px 0px -8% 0px" } as const;
