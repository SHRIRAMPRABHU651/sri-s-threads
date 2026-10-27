import Link from "next/link";
import CollectionGrid from "./CollectionGrid";
import SectionTitle from "./SectionTitle";
import { listCollections } from "@/lib/db";
import { COLLECTION_KINDS } from "@/lib/shared";
import type { CollectionKind } from "@/lib/types";

/** Shared by Top Collection / Shop by Fabric / Shop by Occasion — cards come from the admin-managed list. */
export default async function CollectionsPage({ kind }: { kind: CollectionKind }) {
  const meta = COLLECTION_KINDS.find((k) => k.kind === kind)!;
  const cards = await listCollections(kind);
  return (
    <section className="section">
      <SectionTitle as="h1">{meta.title}</SectionTitle>
      {cards.length === 0 ? (
        <div className="empty">
          <p>Nothing here yet — check back soon.</p>
          <Link href="/shop" className="btn btn--primary">Browse all products</Link>
        </div>
      ) : (
        <CollectionGrid cards={cards} hrefFor={(c) => `/shop?${meta.param}=${c.slug}`} variant="3" />
      )}
    </section>
  );
}
