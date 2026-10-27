import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getSettings, listCollections } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, tops] = await Promise.all([getSettings(), listCollections("collection")]);
  return (
    <>
      <Header announcement={settings.announcement} collections={tops.map((c) => ({ slug: c.slug, name: c.name }))} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
