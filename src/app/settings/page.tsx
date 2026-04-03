import { Metadata } from "next";
import { SettingsPageClient } from "@/components/pages/SettingsPageClient";

export const metadata: Metadata = {
  title: "Settings | AnonHost",
  description: "Manage your account settings.",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
