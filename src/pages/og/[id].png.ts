import type { APIRoute } from "astro";
import { getAllArtifacts } from "../../lib/artifacts";
import { buildOgSvg, svgToPng } from "../../lib/og-image";

export function getStaticPaths() {
  const artifacts = getAllArtifacts();
  return artifacts.map(({ manifest }) => ({
    params: { id: manifest.id },
    props: { manifest },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const svg = buildOgSvg(props.manifest);
  const png = await svgToPng(svg);
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
