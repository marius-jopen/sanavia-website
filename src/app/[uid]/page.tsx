import { Metadata } from "next";
import { notFound } from "next/navigation";

import { asText, filter } from "@prismicio/client";
import { SliceZone } from "@prismicio/react";

import { createClient } from "@/prismicio";
import { components } from "@/slices";
import { SliceComponentProps } from "@prismicio/react";
import { Content } from "@prismicio/client";

type Params = { uid: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { uid } = await params;
  const client = createClient();
  const page = await client.getByUID("page", uid).catch(() => notFound());

  // Fetch settings data for components that need it (like Grid)
  const settings = await client.getSingle("header");

  // Create enhanced components that include settings data
  const enhancedComponents = {
    ...components,
    grid: (props: SliceComponentProps<Content.GridSlice>) => {
      const GridComponent = components.grid;
      return <GridComponent {...props} settings={settings.data} />;
    }
  };

  const pageHeading = page.data.meta_title || asText(page.data.title) || uid;

  return (
    <>
      <h1 className="sr-only">{pageHeading}</h1>
      <SliceZone slices={page.data.slices} components={enhancedComponents} />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { uid } = await params;
  const client = createClient();
  const page = await client.getByUID("page", uid).catch(() => notFound());
  const pageTitle = asText(page.data.title);
  const metaTitle = page.data.meta_title;

  return {
    title: metaTitle ? { absolute: metaTitle } : pageTitle || undefined,
    description: page.data.meta_description,
    alternates: { canonical: `/${uid}` },
    openGraph: {
      title: metaTitle ?? pageTitle ?? undefined,
      images: [{ url: page.data.meta_image.url ?? "" }],
    },
  };
}

export async function generateStaticParams() {
  const client = createClient();

  // Get all pages from Prismic, except the homepage.
  const pages = await client.getAllByType("page", {
    filters: [filter.not("my.page.uid", "home")],
  });

  return pages.map((page) => ({ uid: page.uid }));
}
