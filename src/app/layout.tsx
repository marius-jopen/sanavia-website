import { PrismicPreview } from "@prismicio/next";
import { repositoryName, createClient } from "@/prismicio";
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
        <Header data={settings.data} />
        {children}
        <Footer data={settings.data} />
        <Background />
      </body>
      <PrismicPreview repositoryName={repositoryName} />
    </html>
  );
}
