import type { Metadata, Viewport } from "next";
import "./globals.css";
import Loader from "@/components/Loader";
import { StoreProvider } from "@/components/Store";

export const metadata: Metadata = {
  title: { default: "Sri's Threads — Traditional | Ethnic | Elegant", template: "%s — Sri's Threads" },
  description: "Sarees and ethnic wear — order on WhatsApp. Traditional, ethnic and elegant, from Sri's Threads.",
  icons: { icon: "/logo-emblem.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#092b2b" };

const skipLoader = `try{if(sessionStorage.getItem('st-loaded'))document.documentElement.classList.add('no-loader')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: skipLoader }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Geist:wght@500&family=Inter:wght@400;500&family=Montserrat:wght@400&display=swap"
        />
      </head>
      <body>
        <Loader />
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
