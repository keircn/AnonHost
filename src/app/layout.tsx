import { Root } from "@/components/Root";

export const metadata = {
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    images: {
      url: "https://r2.keiran.cc/7f9f9bfa-632c-400e-83a8-47d11ac2b07f/gmU0CAFB5g4ctPo45tzcN-watermark-1.gif",
      width: 800,
      height: 105,
    },
    url: "https://anon.love",
    siteName: "AnonHost",
    type: "website",
    locale: "en_US",
  },
  metadataBase: new URL("https://anon.love"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Root>{children}</Root>;
}
