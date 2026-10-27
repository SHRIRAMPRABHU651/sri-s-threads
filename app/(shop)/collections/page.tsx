import type { Metadata } from "next";
import CollectionGrid from "@/components/CollectionGrid";
import SectionTitle from "@/components/SectionTitle";
import { TOP_COLLECTIONS } from "@/lib/shared";

export const metadata: Metadata = { title: "Top Collection" };

export default function Page() {
  return (
    <section className="section">
      <SectionTitle as="h1">Top Collection</SectionTitle>
      <CollectionGrid cards={TOP_COLLECTIONS} hrefFor={(c) => `/shop?collection=${c.slug}`} variant="3" />
    </section>
  );
}
