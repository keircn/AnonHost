import { Root } from "@/components/root";

export const metadata = {
  title: "AnonHost - Simple, Fast Image Hosting",
  description: "Upload, share, and manage your images with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Root>{children}</Root>;
}
