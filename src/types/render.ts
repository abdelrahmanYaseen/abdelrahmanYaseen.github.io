export interface RenderContext<TData = unknown> {
  container: HTMLElement;
  data: TData;
  locale: "en" | "ar";
  colorScheme: "dark" | "light";
  reducedMotion: boolean;
}

export interface RenderModule<TData = unknown> {
  mount(ctx: RenderContext<TData>): () => void;
  resize?(ctx: RenderContext<TData>, rect: DOMRect): void;
}
