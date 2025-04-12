import { Metadata } from "next";
import { ShortenerPageClient } from "@/components/pages/ShortenerPageClient";

export const metadata: Metadata = {
  title: "Shortener | AnonHost",
  description: "Shorten your URLs easily.",
};

export default function ShortenerPage() {
  return <ShortenerPageClient />;
}
