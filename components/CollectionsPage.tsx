import Link from "next/link";
import CollectionGrid from "./CollectionGrid";
import SectionTitle from "./SectionTitle";
import { listCollections, listDepartments } from "@/lib/db";
import { COLLECTION_KINDS } from "@/lib/shared";
import type { CollectionKind } from "@/lib/types";

/** Shared by Top Collection / Shop by Fabric / Shop by Occasion — cards come from the admin-managed list. */
export default async function CollectionsPage({ kind }: { kind: CollectionKind }) {
  const meta = COLLECTION_KINDS.find((k) => k.kind === kind)!;
  const [cards, DEPARTMENTS] = await Promise.all([listCollections(kind), listDepartments()]);
  return (
    <section className="section">
      <SectionTitle as="h1">{meta.title}</SectionTitle>
      {cards.length === 0 ? (
        <div className="empty">
          <p>Nothing here yet — check back soon.</p>
          <Link href="/shop" className="btn btn--primary">Browse all products</Link>
        </div>
      ) : kind === "collection" ? (
        // top collections are grouped by department
        DEPARTMENTS.map((d) => {
          const group = cards.filter((c) => c.department === d.slug);
          if (!group.length) return null;
          return (
            <div key={d.slug} className="collections-dept">
              <h2 className="collections-dept__title"><Link href={`/${d.slug}`}>{d.label}</Link></h2>
              <CollectionGrid cards={group} hrefFor={(c) => `/shop?${meta.param}=${c.slug}`} variant="3" />
            </div>
          );
        })
      ) : (
        <CollectionGrid cards={cards} hrefFor={(c) => `/shop?${meta.param}=${c.slug}`} variant="3" />
      )}
    </section>
  );
}
