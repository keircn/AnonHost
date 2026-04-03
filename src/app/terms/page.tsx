import { Metadata } from "next";
import { TermsPageClient } from "@/components/pages/TermsPageClient";

export const metadata: Metadata = {
  title: "Terms | AnonHost",
  description: "Read our terms and conditions.",
};

export default function TermsPage() {
  return <TermsPageClient />;
}
