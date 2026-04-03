import { Metadata } from "next";
import { VerifyPageClient } from "@/components/pages/VerifyPageClient";

export const metadata: Metadata = {
  title: "Verify | AnonHost",
  description: "Verify your account with a one-time code.",
};

export default function VerifyPage() {
  return <VerifyPageClient />;
}
