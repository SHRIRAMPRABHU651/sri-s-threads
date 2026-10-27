import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { BackToTop, ScrollProgress } from "@/components/motion/ScrollUI";
import { DepartmentsProvider } from "@/components/Departments";
import { getSettings, listCollections, listDepartments } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, tops, departments] = await Promise.all([getSettings(), listCollections("collection"), listDepartments()]);
  return (
    <DepartmentsProvider departments={departments}>
      <ScrollProgress />
      <Header announcement={settings.announcement} collections={tops.map((c) => ({ slug: c.slug, name: c.name, department: c.department }))} />
      <main>{children}</main>
      <Footer />
      <BackToTop />
    </DepartmentsProvider>
  );
}
