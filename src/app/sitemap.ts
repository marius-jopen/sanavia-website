import type { MetadataRoute } from "next";
import { createClient } from "@/prismicio";

const SITE_URL =
  process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://www.sanavia.bio";

// UIDs whose pages should stay out of the public sitemap (tests, error pages, etc.)
const EXCLUDED_UID_PREFIXES = ["test-"];
const EXCLUDED_UIDS = new Set(["error"]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = createClient();
  const pages = await client.getAllByType("page");

  return pages
    .filter(
      (page) =>
        !EXCLUDED_UIDS.has(page.uid) &&
        !EXCLUDED_UID_PREFIXES.some((prefix) => page.uid.startsWith(prefix)),
    )
    .map((page) => {
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
