import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const artifacts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/artifacts" }),
  schema: z.object({
    manifestId: z.string(),
    featured: z.boolean().default(false),
    publishedAt: z.string(),
  }),
});

export const collections = { artifacts };
