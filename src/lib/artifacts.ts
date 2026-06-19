import type { ArtifactManifest } from "../types/manifest";

const manifests = import.meta.glob<{ default: ArtifactManifest }>(
  "../artifacts/*/manifest.json",
  { eager: true }
);

const dataFiles = import.meta.glob<{ default: unknown }>(
  "../artifacts/*/data.json",
  { eager: true }
);

export interface LoadedArtifact {
  manifest: ArtifactManifest;
  data: unknown;
  slug: string;
}

export function getAllArtifacts(): LoadedArtifact[] {
  return Object.entries(manifests).map(([path, mod]) => {
    const slug = path.match(/\/artifacts\/([^/]+)\/manifest\.json$/)?.[1] ?? "";
    const dataPath = path.replace("manifest.json", "data.json");
    const data = dataFiles[dataPath]?.default ?? null;
    return { manifest: mod.default, data, slug };
  });
}

export function getArtifactBySlug(slug: string): LoadedArtifact | undefined {
  return getAllArtifacts().find((a) => a.slug === slug);
}

export function getArtifactsByCategory(category: string): LoadedArtifact[] {
  return getAllArtifacts().filter((a) => a.manifest.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(getAllArtifacts().map((a) => a.manifest.category))];
}
