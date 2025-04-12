import { Metadata } from "next";
import { ContactPageClient } from "@/components/pages/ContactPageClient";

export const metadata: Metadata = {
  title: "Contact | AnonHost",
  description: "Get in touch with us for any inquiries or support.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
