# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server + Slice Machine:** `npm run dev` (runs Next.js on :3000 and Slice Machine on :9999)
- **Dev server only:** `npm run next:dev`
- **HTTPS dev:** `npm run dev:https`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Format:** `npm run format` (Prettier)
- **Slice Machine only:** `npm run slicemachine`

## Branching & Deployment

- **`main`** — production. Never merge to main without explicit client approval.
- **`staging`** — client-facing preview. Merge feature work here after local testing.
- Workflow: develop locally → test → merge to `staging` → client reviews → client approves → merge to `main`.

## Architecture

This is a Next.js 15 App Router site using Prismic as a headless CMS, Tailwind CSS 4 for styling, and TypeScript.

### Content Model (Prismic)

All pages are the `page` custom type. The homepage is the page with UID `"home"` (routed to `/`); all other pages route to `/:uid`. Content is composed of **slices** managed through Prismic's Slice Machine.

The `header` custom type (singleton) stores site-wide settings (navigation, footer, CTA data). It's fetched in the root layout and passed to Header/Footer, and also injected into the `Grid` slice via enhanced components in the page files.

### Routing

- `src/app/page.tsx` — homepage (fetches page with UID "home")
- `src/app/[uid]/page.tsx` — all other pages (with `generateStaticParams`)
- `src/app/api/` — Prismic preview and revalidation endpoints
- `src/app/slice-simulator/` — dev-only slice preview

### Slices (`src/slices/`)

Each slice is a directory with an `index.tsx` component and a `model.json` schema. Slices are registered in `src/slices/index.ts`. Key slices: Grid (Matter.js physics), PopText, PopVideo, Video, Slider, Team/TeamAdvanced, Scrollytelling, Cards, Contact.

### Components (`src/components/`)

Shared UI components used across slices and layouts. Notable: Header, Footer, Navigation/MobileNav, Background, Modal, Slider, VideoBasic/VideoMinimal, ScrollSequence, ModelViewer.

### Key Libraries

- **GSAP** — scroll-triggered animations and transitions throughout slices
- **Matter.js** — 2D physics engine used in the Grid slice
- **Splide.js** — carousel/slider functionality
- **Three.js** — 3D rendering (ModelViewer component)

### Prismic Client (`src/prismicio.ts`)

Configures the Prismic client with route resolvers and caching. Production uses `force-cache` with tags; development uses 5-second revalidation. Repository name can be overridden via `NEXT_PUBLIC_PRISMIC_ENVIRONMENT` env var.

### Type Generation

Prismic types are auto-generated in `prismicio-types.d.ts` at the project root. Custom type schemas live in `customtypes/`. Do not manually edit `prismicio-types.d.ts`.
