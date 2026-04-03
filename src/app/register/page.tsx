import { Metadata } from "next";
import { RegisterPageClient } from "@/components/pages/RegisterPageClient";

export const metadata: Metadata = {
  title: "Register | AnonHost",
  description: "Create an account to get started.",
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
