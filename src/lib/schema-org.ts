import type { ArtifactManifest } from "../types/manifest";

export function buildDatasetJsonLd(manifest: ArtifactManifest, pageUrl: string): string {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: manifest.title,
    description: manifest.dek,
    keywords: manifest.tags,
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "howdoesitlooklike",
      url: "https://howdoesitlooklike.com",
    },
    isBasedOn: manifest.source.url,
  };
  if (manifest.lastFetched) {
    schema.dateModified = manifest.lastFetched;
  }
  if (manifest.source.license) {
    schema.license = manifest.source.license;
  }
  return JSON.stringify(schema);
}
