import type { Metadata } from "next";
import CollectionGrid from "@/components/CollectionGrid";
import SectionTitle from "@/components/SectionTitle";
import { OCCASIONS } from "@/lib/shared";

export const metadata: Metadata = { title: "Shop by Occasion" };

export default function Page() {
  return (
    <section className="section">
      <SectionTitle as="h1">Shop by Occasion</SectionTitle>
      <CollectionGrid cards={OCCASIONS} hrefFor={(c) => `/shop?occasion=${c.slug}`} variant="3" />
    </section>
  );
}
