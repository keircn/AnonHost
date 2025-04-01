import { Root } from "@/components/root";

export const metadata = {
  title: "AnonHost - Simple, Fast Image Hosting",
  description: "Upload, share, and manage your images with ease.",
  openGraph: {
    images: 'https://keiran.cc/a70c08',
  },
  metadataBase: new URL('https://keiran.cc'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Root>{children}</Root>;
}
