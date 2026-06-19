# howdoesitlooklike

A curated gallery of live, data-driven visual essays. Built with Astro + D3 + GSAP, hosted on Cloudflare Pages.

## Adding a new artifact

Every artifact is a self-contained folder in `src/artifacts/<slug>/`.

### Required files

```
src/artifacts/<slug>/
  manifest.json        — metadata contract (see schema below)
  render.ts            — D3/canvas2d/three.js render module
  data.json            — current data snapshot
  essay.en.md          — 150–300 word prose essay
  thumbnail.svg        — static preview (400×300 viewBox)
```

Also create `src/content/artifacts/<slug>.md`:

```md
---
manifestId: <slug>
featured: false
publishedAt: "YYYY-MM-DD"
---
```

Copy the thumbnail to `public/artifacts/<slug>/thumbnail.svg` so it's served as a static asset.

### manifest.json schema

```json
{
  "id": "my-artifact",
  "title": "Human-readable title",
  "dek": "One-sentence description of what the data shows.",
  "category": "demographics",
  "tags": ["tag1", "tag2"],
  "dataMode": "live | synced | static | simulated",
  "renderEngine": "d3 | three | canvas2d",
  "refreshCron": "*/15 * * * *",
  "source": {
    "name": "Source Name",
    "url": "https://source.example/",
    "type": "rest",
    "endpoint": "https://api.example/data.json",
    "transform": "transform.ts",
    "license": "CC BY 4.0"
  },
  "annotate": {
    "enabled": false,
    "promptTemplate": "prompts/annotate.txt",
    "tone": "curious",
    "generatedBy": "human"
  },
  "suggestedLenses": [
    {
      "label": "Interesting angle",
      "chartParam": { "sortBy": "value" }
    }
  ],
  "i18n": {
    "defaultLocale": "en",
    "locales": { "en": { "source": "human" } }
  },
  "lastFetched": "2026-06-19T00:00:00Z"
}
```

### render.ts contract

Export a default object implementing `RenderModule` from `src/types/render.ts`:

```typescript
import type { RenderModule } from "../../types/render";

const myModule: RenderModule<MyDataType> = {
  mount(ctx) {
    const { container, data, colorScheme, reducedMotion } = ctx;
    // Set up D3/GSAP, return cleanup function
    return () => { /* cleanup */ };
  },
};

export default myModule;
```

The `mount()` function receives the DOM container and parsed `data.json`. It must return a cleanup function called when the page unmounts.

Expose `container.updateLens = (params) => {...}` to make lens pills functional.

### Categories

- `demographics`
- `earth-and-climate`
- `history`
- `space-and-science`
- `culture`

### Data modes

| Mode | data.json source | GitHub Actions |
|------|-----------------|----------------|
| `live` | Cron, every 15–60 min | `fetch-<id>.yml` |
| `synced` | Cron, daily/weekly | `fetch-<id>.yml` |
| `static` | Hand-authored, committed once | none |
| `simulated` | Computed in render.ts, no file needed | none |

For `live` and `synced`, add the fetcher to `scripts/fetch-artifact.ts` and create `.github/workflows/fetch-<slug>.yml` following the existing pattern.

## Commands

```
npm run dev        # dev server at localhost:4321
npm run build      # production build → ./dist/
npm run preview    # preview the build

# Manually trigger a data fetch (requires network access):
npx tsx scripts/fetch-artifact.ts earthquakes-live
npx tsx scripts/fetch-artifact.ts births-by-country
```

## Tech stack

- **Astro 6** — static site generation, i18n routing
- **D3 7** — data-driven layout math
- **GSAP 3** — animation choreography (ScrollTrigger for nuclear-tests)
- **sharp** — OG image PNG generation at build time
- **Cloudflare Pages** — hosting (deploy from `./dist/`)

## i18n

Routes are prefixed: `/en/...` and `/ar/...`. The Arabic locale (`/ar/`) has placeholder content proving RTL scaffolding works — HTML `dir="rtl"`, CSS logical properties throughout. No Arabic translation work has been done yet.

Translation strings live in `src/lib/i18n.ts`. Add a locale by extending the `translations` object and the `Locale` type.

## SEO

Every artifact page includes:
- Server-rendered title, dek, essay text (no JS required for crawlers)
- `<meta name="description">`, canonical URL, OG tags
- `schema.org/Dataset` JSON-LD structured data
- Pre-rendered OG PNG at `/og/<id>.png`
- `sitemap.xml` generated at build time

## Deployment

Push to `main` → GitHub Actions runs `npm run build` → deploys `./dist/` to Cloudflare Pages via `cloudflare/wrangler-action`.

Required secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `GH_PAT` (for data cron commits).
