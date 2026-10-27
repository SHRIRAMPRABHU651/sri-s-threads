export default function SectionTitle({ children, as: Tag = "h2" }: { children: React.ReactNode; as?: "h1" | "h2" }) {
  return (
    <div className="section-title">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/icons/divider-top.svg" alt="" width={166} height={14} />
      <Tag>{children}</Tag>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/icons/divider-bottom.svg" alt="" width={166} height={14} />
    </div>
  );
}
