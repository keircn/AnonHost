import { Root } from "@/components/Layout/Root";

export const metadata = {
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    url: "https://anonhost.cc",
    siteName: "AnonHost",
    type: "website",
    locale: "en_US",
  },
  metadataBase: new URL("https://anonhost.cc"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Root>{children}</Root>;
}
