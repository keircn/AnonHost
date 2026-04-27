import { Root } from "@/components/Layout/Root";

export const metadata = {
  icons: {
    icon: "/brand/anonhost.svg",
    shortcut: "/brand/anonhost.svg",
  },
  openGraph: {
    url: "https://anonhost.cc",
    siteName: "AnonHost",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/brand/anonhost-fill.png",
        width: 1200,
        height: 630,
        alt: "AnonHost - Fast, Private File Hosting",
      },
    ],
  },
  metadataBase: new URL("https://anonhost.cc"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Root>{children}</Root>;
}
