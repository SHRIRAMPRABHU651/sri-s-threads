import Link from "next/link";
import SmartImg from "./SmartImg";
import { Stagger, StaggerItem } from "./motion/Reveal";

export type CollectionCard = { slug: string; name: string; image: string };

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
    <Stagger className={`collection-grid${variant ? ` collection-grid--${variant}` : ""}`} gap={0.09}>
      {cards.map((c) => (
        <StaggerItem key={c.slug}>
          <Link href={hrefFor(c)} className="collection-card">
            <div className="collection-card__arch">
              <SmartImg src={c.image} alt="" w={600} sizes="(max-width: 640px) 45vw, 260px" />
            </div>
            <span className="collection-card__label">{c.name}</span>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
