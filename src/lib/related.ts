import type { ArtifactManifest } from "../types/manifest";

export function scoreRelated(
  target: ArtifactManifest,
  candidates: ArtifactManifest[],
  topN = 3
): ArtifactManifest[] {
  const targetSet = new Set(target.tags);
  return candidates
    .filter((c) => c.id !== target.id)
    .map((c) => {
      const candSet = new Set(c.tags);
      const intersection = [...targetSet].filter((t) => candSet.has(t)).length;
      const union = new Set([...targetSet, ...candSet]).size;
      return { manifest: c, score: union === 0 ? 0 : intersection / union };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((r) => r.manifest);
}
