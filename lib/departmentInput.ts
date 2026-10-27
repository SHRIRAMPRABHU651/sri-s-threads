import { bool, num, str } from "./api";
import { RESERVED_SLUGS, slugify } from "./shared";
import type { DepartmentDef } from "./types";

/** Validates & normalises an admin-submitted department. */
export function parseDepartment(body: Record<string, unknown>): DepartmentDef | { error: string } {
  const label = str(body.label, 40);
  if (label.length < 2) return { error: "Department name is required." };
  const slug = slugify(str(body.slug, 40) || label);
  if (!slug) return { error: "Name must contain letters or numbers." };
  if (RESERVED_SLUGS.includes(slug)) return { error: `"${slug}" is a reserved web address — choose a different name.` };
  const image = str(body.image, 500);
  if (!image) return { error: "Add a picture for the department card." };
  const sizes = [...new Set((Array.isArray(body.sizes) ? body.sizes : []).map((x) => str(x, 20)).filter(Boolean))].slice(0, 30);
  return {
    slug,
    label,
    blurb: str(body.blurb, 140),
    image,
    sizes: sizes.length ? sizes : ["Free size"],
    active: body.active === undefined ? true : bool(body.active),
    sort: Math.round(num(body.sort, 100)),
  };
}
