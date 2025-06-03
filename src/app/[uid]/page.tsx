import { Metadata } from "next";
import { notFound } from "next/navigation";

import { asText, filter } from "@prismicio/client";
import { SliceZone } from "@prismicio/react";

import { createClient } from "@/prismicio";
import { components } from "@/slices";

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
    grid: (props: any) => {
      const GridComponent = components.grid;
      return <GridComponent {...props} settings={settings.data} />;
    }
  };

  // <SliceZone> renders the page's slices with enhanced components
  return <SliceZone slices={page.data.slices} components={enhancedComponents} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { uid } = await params;
  const client = createClient();
  const page = await client.getByUID("page", uid).catch(() => notFound());

  return {
    title: asText(page.data.title),
    description: page.data.meta_description,
    openGraph: {
      title: page.data.meta_title ?? undefined,
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
