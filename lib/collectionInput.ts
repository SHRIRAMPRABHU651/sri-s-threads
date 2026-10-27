import { bool, num, str } from "./api";
import { isDepartment, slugify } from "./shared";
import type { Collection } from "./types";

const KINDS: Collection["kind"][] = ["collection", "fabric", "occasion"];

export function parseCollection(body: Record<string, unknown>): Omit<Collection, "id"> | { error: string } {
  const name = str(body.name, 60);
  if (name.length < 2) return { error: "Name is required." };
  const kind = KINDS.find((k) => k === body.kind);
  if (!kind) return { error: "Choose where this collection belongs." };
  const image = str(body.image, 500);
  if (!image) return { error: "Add an image for the collection card." };
  const slug = slugify(str(body.slug, 80) || name);
  if (!slug) return { error: "Name must contain letters or numbers." };
  const department = kind === "collection" ? (isDepartment(body.department) ? body.department : "women") : "";
  return { kind, slug, name, image, department, featured: kind === "collection" && bool(body.featured), active: body.active === undefined ? true : bool(body.active), sort: Math.round(num(body.sort, 100)) };
}
