import Link from "next/link";
import type { DepartmentDef } from "@/lib/types";
import SmartImg from "./SmartImg";
import { Stagger, StaggerItem } from "./motion/Reveal";

/** "Shop by department" — tall arches with an overlay label, one per department that is switched on. */
export default function DeptCards({ departments }: { departments: DepartmentDef[] }) {
  return (
    <Stagger className="dept-cards" gap={0.1} style={{ ["--dept-n" as string]: Math.min(departments.length, 4) }}>
      {departments.map((d) => (
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
