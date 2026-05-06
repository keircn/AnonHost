import { Metadata } from "next";
import { PrivateUploadPageClient } from "@/components/pages/PrivateUploadPageClient";

export const metadata: Metadata = {
  title: "Private Upload | AnonHost",
  description: "Create password-protected private file transfers.",
};

export default function PrivateUploadPage() {
  return <PrivateUploadPageClient />;
}
