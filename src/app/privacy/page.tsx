import { Metadata } from "next";
import { PrivacyPageClient } from "@/components/pages/PrivacyPageClient";

export const metadata: Metadata = {
  title: "Privacy | AnonHost",
  description: "Learn more about our privacy practices.",
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
