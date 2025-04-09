import { Root } from "@/components/Root";

export const metadata = {
  title: "AnonHost - Simple, Fast File Hosting",
  description: "Upload, share, and manage your files with ease.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    images: "https://r2.keiran.cc/1/aev8sKbvuc7uQ--Zml2kP-archium-dark.png",
    title: "AnonHost - Simple, Fast File Hosting",
    description: "Upload, share, and manage your files with ease.",
    url: "https://keiran.cc",
    siteName: "AnonHost",
    type: "website",
    locale: "en_US",
  },
  metadataBase: new URL("https://keiran.cc"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Root>{children}</Root>;
}
