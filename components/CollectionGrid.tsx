import Link from "next/link";
import type { CollectionCard } from "@/lib/shared";

/** Arched collection cards (Figma: collection_card). */
export default function CollectionGrid({
  cards,
  hrefFor,
  variant,
}: {
  cards: CollectionCard[];
  hrefFor: (c: CollectionCard) => string;
  variant?: "3" | "2";
}) {
  return (
    <div className={`collection-grid${variant ? ` collection-grid--${variant}` : ""}`}>
      {cards.map((c) => (
        <Link key={c.slug} href={hrefFor(c)} className="collection-card">
          <div className="collection-card__arch">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.image} alt="" loading="lazy" />
          </div>
          <span className="collection-card__label">{c.label}</span>
        </Link>
      ))}
    </div>
  );
}
