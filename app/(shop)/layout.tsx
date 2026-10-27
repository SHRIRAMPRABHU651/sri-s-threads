import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <Header announcement={settings.announcement} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
