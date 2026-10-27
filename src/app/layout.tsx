import type { Metadata, Viewport } from "next";
import "@fontsource-variable/geist/index.css";
import "@fontsource-variable/montserrat/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DUKES Designer Shoes | Handmade leather shoes, chappal and leather goods",
    template: "%s | DUKES",
  },
  description:
    "Handmade designer dress shoes, sandals, chappal, belts and wallets in pure leather. Delivery across Pakistan with cash on delivery.",
  icons: { icon: "/brand/lion.png" },
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
