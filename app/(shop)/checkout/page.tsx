import type { Metadata } from "next";
import CheckoutView from "@/components/CheckoutView";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = { title: "Order on WhatsApp" };

export default function Page() {
  return (
    <section className="page-narrow">
      <SectionTitle as="h1">Place your order</SectionTitle>
      <CheckoutView />
    </section>
  );
}
