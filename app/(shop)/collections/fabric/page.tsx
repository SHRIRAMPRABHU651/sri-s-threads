import type { Metadata } from "next";
import CollectionGrid from "@/components/CollectionGrid";
import SectionTitle from "@/components/SectionTitle";
import { FABRICS } from "@/lib/shared";

export const metadata: Metadata = { title: "Shop by Fabric" };

export default function Page() {
  return (
    <section className="section">
      <SectionTitle as="h1">Shop by Fabric</SectionTitle>
      <CollectionGrid cards={FABRICS} hrefFor={(c) => `/shop?fabric=${c.slug}`} variant="3" />
    </section>
  );
}
