import { asText } from "@prismicio/client";
import { createClient } from "@/prismicio";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.sanavia.bio";

export async function GET() {
  const client = createClient();
  const pages = await client.getAllByType("page");

  const homepage = pages.find((p) => p.uid === "home");
  const otherPages = pages.filter((p) => p.uid !== "home");

  const siteTitle = homepage ? asText(homepage.data.title) || "Sanavia" : "Sanavia";
  const siteSummary =
    homepage?.data.meta_description ||
    "Sanavia develops novel antibody-drug conjugate (ADC) therapies targeting cancer. Learn about our science, pipeline, and team.";

  const pagesSection = otherPages
    .map((p) => {
      const title = asText(p.data.title) || p.uid;
      const desc = p.data.meta_description || "";
      const url = `${SITE_URL}/${p.uid}`;
      return desc ? `- [${title}](${url}): ${desc}` : `- [${title}](${url})`;
    })
    .join("\n");

  const body = `# ${siteTitle}

> ${siteSummary}

## Pages

- [Home](${SITE_URL}/): ${siteSummary}
${pagesSection}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
