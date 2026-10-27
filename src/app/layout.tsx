import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/geist/index.css";
import "@fontsource-variable/montserrat/wght.css";
import "./globals.css";
import "./components.css";

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

// Applies the saved black/white theme before the first paint (no flash).
const themeScript = `try{var t=localStorage.getItem("dukes-theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;if(t==="light"){var m=document.querySelector('meta[name="theme-color"]');m&&m.setAttribute("content","#ffffff")}}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
