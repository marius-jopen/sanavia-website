import { PrismicPreview } from "@prismicio/next";
import { repositoryName, createClient } from "@/prismicio";
import Background from "@/components/Background";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
import Script from "next/script";
import type { Viewport, Metadata } from "next";

// Ensure iOS uses the visual viewport and allows content under safe areas
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const client = createClient();
  const settings = await client.getSingle("header");

  return (
    <html lang="en" className="overflow-x-clip">
      <body className="w-full overflow-x-clip">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9WB5C8BYNX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9WB5C8BYNX');
          `}
        </Script>
        <Header data={settings.data} />
        {children}
        <Footer data={settings.data} />
        <Background />
      </body>
      <PrismicPreview repositoryName={repositoryName} />
    </html>
  );
}
