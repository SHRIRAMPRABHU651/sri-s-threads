/**
 * "Fly to bag": a clone of the product photo arcs from where it was tapped to the bag icon, shrinking as it goes,
 * then the bag icon pulses. Built on the Web Animations API (compositor-friendly, no layout work) and skipped
 * entirely for reduced-motion users.
 */
export function flyToBag(source: Element | null, imageUrl: string) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.querySelector<HTMLElement>("[data-bag-icon]");
  if (!source || !target) return;
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = Math.min(from.width, from.height, 120);

  const ghost = document.createElement("img");
  ghost.src = imageUrl;
  ghost.alt = "";
  Object.assign(ghost.style, {
    position: "fixed", left: "0", top: "0", width: `${size}px`, height: `${size}px`, objectFit: "cover", borderRadius: "12px",
    zIndex: "400", pointerEvents: "none", boxShadow: "0 10px 30px rgba(9,43,43,.35)", willChange: "transform, opacity",
  } as CSSStyleDeclaration);
  document.body.appendChild(ghost);

  const sx = from.left + from.width / 2 - size / 2;
  const sy = from.top + from.height / 2 - size / 2;
  const ex = to.left + to.width / 2 - size / 2;
  const ey = to.top + to.height / 2 - size / 2;
  const mx = sx + (ex - sx) * 0.55;
  const my = Math.min(sy, ey) - 90; // arc up, then settle into the bag

  const anim = ghost.animate(
    [
      { transform: `translate(${sx}px, ${sy}px) scale(1)`, opacity: 0.95, offset: 0 },
      { transform: `translate(${mx}px, ${my}px) scale(0.7)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${ex}px, ${ey}px) scale(0.12)`, opacity: 0.25, offset: 1 },
    ],
    { duration: 780, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
  anim.onfinish = () => {
    ghost.remove();
    target.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.28)" }, { transform: "scale(0.94)" }, { transform: "scale(1)" }],
      { duration: 420, easing: "ease-out" },
    );
  };
}
