import type { MetadataRoute } from "next";
import { createClient } from "@/prismicio";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.sanavia.bio";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = createClient();
  const pages = await client.getAllByType("page");

  return pages.map((page) => {
    const url = page.uid === "home" ? `${SITE_URL}/` : `${SITE_URL}/${page.uid}`;
    const lastModified = page.last_publication_date
      ? new Date(page.last_publication_date)
      : new Date();
    return {
      url,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: page.uid === "home" ? 1 : 0.7,
    };
  });
}
