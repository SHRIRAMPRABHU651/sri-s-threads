import type { Metadata } from "next";
import SectionTitle from "@/components/SectionTitle";
import WishlistView from "@/components/WishlistView";

export const metadata: Metadata = { title: "Wishlist" };

export default function Page() {
  return (
    <section className="section">
      <SectionTitle as="h1">My Wishlist</SectionTitle>
      <WishlistView />
    </section>
  );
}
