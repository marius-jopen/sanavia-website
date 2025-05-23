import { PrismicPreview } from "@prismicio/next";
import { repositoryName, createClient } from "@/prismicio";
import { AccordionProvider } from "@/components/AccordionProvider";
import Background from "@/components/Background";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const client = createClient();
  const settings = await client.getSingle("header");

  return (
    <html lang="en">
      <body className="w-full overflow-x-hiden">
        <AccordionProvider type="poptext">
          <Header data={settings.data} />
          {children}
          <Footer data={settings.data} />
          <Background />
        </AccordionProvider>
      </body>
      <PrismicPreview repositoryName={repositoryName} />
    </html>
  );
}
