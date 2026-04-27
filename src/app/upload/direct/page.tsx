import type { Metadata } from "next";
import { DirectUploadPageClient } from "@/components/pages/DirectUploadPageClient";

export const metadata: Metadata = {
  title: "Direct Upload | AnonHost",
  description: "Upload files directly from the browser to R2.",
};

export default function DirectUploadPage() {
  return <DirectUploadPageClient />;
}
