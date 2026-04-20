import type { JSXMapSerializer } from "@prismicio/react";

// Shared Rich Text component overrides. Renders heading-1 RichText blocks as
// semantic h2 so that each page has at most one h1 (rendered at page level).
// The className replicates the global h1 visual styling; parent-scoped
// overrides (e.g. `.headline h2`) can still adjust sizing.
export const richTextComponents: JSXMapSerializer = {
  heading1: ({ children, key }) => (
    <h2
      key={key}
      className="text-4xl md:text-[75px] font-normal leading-10 md:leading-20"
    >
      {children}
    </h2>
  ),
};
