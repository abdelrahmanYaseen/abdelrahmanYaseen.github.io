export type DataMode = "live" | "synced" | "static" | "simulated";
export type RenderEngine = "d3" | "three" | "canvas2d";

export interface AnnotateConfig {
  enabled: boolean;
  promptTemplate: string;
  tone: string;
  generatedBy: "human" | "machine";
}

export interface SuggestedLens {
  label: string;
  chartParam: Record<string, unknown>;
}

export interface ArtifactManifest {
  id: string;
  title: string;
  dek: string;
  category: string;
  tags: string[];
  dataMode: DataMode;
  renderEngine: RenderEngine;
  refreshCron?: string;
  source: {
    name: string;
    url: string;
    type?: string;
    endpoint?: string;
    transform?: string;
    license?: string;
  };
  annotate: AnnotateConfig;
  suggestedLenses: SuggestedLens[];
  i18n: {
    defaultLocale: string;
    locales: Record<string, { source: "human" | "machine" }>;
  };
  lastFetched?: string;
}
