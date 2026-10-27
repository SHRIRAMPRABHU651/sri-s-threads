import type { Metadata } from "next";
import CartView from "@/components/CartView";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = { title: "My Bag" };

export default function Page() {
  return (
    <section className="page-narrow">
      <SectionTitle as="h1">My Bag</SectionTitle>
      <CartView />
    </section>
  );
}
