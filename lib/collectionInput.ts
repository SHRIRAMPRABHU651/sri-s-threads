import { bool, num, str } from "./api";
import { isDepartment, slugify } from "./shared";
import type { Collection, DepartmentDef } from "./types";

const KINDS: Collection["kind"][] = ["collection", "fabric", "occasion"];

export function parseCollection(body: Record<string, unknown>, depts: DepartmentDef[]): Omit<Collection, "id"> | { error: string } {
  const name = str(body.name, 60);
  if (name.length < 2) return { error: "Name is required." };
  const kind = KINDS.find((k) => k === body.kind);
  if (!kind) return { error: "Choose where this collection belongs." };
  const image = str(body.image, 500);
  if (!image) return { error: "Add an image for the collection card." };
  const slug = slugify(str(body.slug, 80) || name);
  if (!slug) return { error: "Name must contain letters or numbers." };
  if (kind === "collection" && !isDepartment(body.department, depts)) return { error: "Choose a department for this collection." };
  const department = kind === "collection" ? String(body.department) : "";
  return { kind, slug, name, image, department, featured: kind === "collection" && bool(body.featured), active: body.active === undefined ? true : bool(body.active), sort: Math.round(num(body.sort, 100)) };
}
