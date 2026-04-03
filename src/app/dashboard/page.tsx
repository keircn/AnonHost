import { Metadata } from "next";
import { DashboardPageClient } from "@/components/pages/DashboardPageClient";

export const metadata: Metadata = {
  title: "Dashboard | AnonHost",
  description: "Manage your uploaded files and view account statistics",
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
