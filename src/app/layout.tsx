import { Root } from "@/components/Root";

export const metadata = {
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
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
