import Link from "next/link";
import { DEPARTMENTS } from "@/lib/shared";
import SmartImg from "./SmartImg";
import { Stagger, StaggerItem } from "./motion/Reveal";

/** "Shop by department" — four tall arches with an overlay label. */
export default function DeptCards() {
  return (
    <Stagger className="dept-cards" gap={0.1}>
      {DEPARTMENTS.map((d) => (
        <StaggerItem key={d.slug}>
          <Link href={`/${d.slug}`} className="dept-card">
            <SmartImg src={d.image} alt="" w={640} sizes="(max-width: 700px) 45vw, 280px" />
            <span className="dept-card__shade" aria-hidden="true" />
            <span className="dept-card__text">
              <span className="dept-card__name">{d.label}</span>
              <span className="dept-card__cta">Shop now <span aria-hidden="true">→</span></span>
            </span>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
