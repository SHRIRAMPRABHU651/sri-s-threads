import type { Metadata } from "next";
import CollectionsPage from "@/components/CollectionsPage";
import { COLLECTION_KINDS } from "@/lib/shared";

export const metadata: Metadata = { title: COLLECTION_KINDS.find((k) => k.kind === "occasion")!.title };

export default function Page() {
  return <CollectionsPage kind="occasion" />;
}
