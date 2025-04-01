import { Root } from "@/components/root";

export const metadata = {
  title: "AnonHost - Simple, Fast Image Hosting",
  description: "Upload, share, and manage your images with ease.",
  openGraph: {
    images: 'https://r2.keiran.cc/1/aev8sKbvuc7uQ--Zml2kP-archium-dark.png',
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
