import type { ArtifactManifest } from "../types/manifest";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BADGE_COLORS: Record<string, string> = {
  live: "#4ade80",
  synced: "#60a5fa",
  static: "#9A988F",
  simulated: "#c084fc",
};

export function buildOgSvg(manifest: ArtifactManifest): string {
  const accent = BADGE_COLORS[manifest.dataMode] ?? "#D89A4E";
  const title = escapeXml(manifest.title);
  const dek = escapeXml(manifest.dek.length > 90 ? manifest.dek.slice(0, 87) + "…" : manifest.dek);
  const cat = escapeXml(manifest.category.replace(/-/g, " "));
  const mode = manifest.dataMode.toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0E0F12"/>
  <rect x="0" y="0" width="6" height="630" fill="${accent}"/>
  <rect x="0" y="0" width="1200" height="1" fill="#2A2B30"/>
  <rect x="0" y="629" width="1200" height="1" fill="#2A2B30"/>

  <!-- Signature mark -->
  <svg x="60" y="48" width="32" height="32" viewBox="0 0 18 18">
    <polygon points="9,1 17,9 9,17 1,9" fill="none" stroke="#D89A4E" stroke-width="0.75"/>
    <circle cx="9" cy="9" r="2" fill="#D89A4E"/>
  </svg>
  <text x="102" y="72" font-family="'IBM Plex Mono', monospace" font-size="13" fill="#9A988F" letter-spacing="0.08em">HOWDOESITLOOKLIKE</text>

  <!-- Data mode badge -->
  <rect x="60" y="110" width="${mode.length * 8 + 20}" height="24" rx="4" fill="none" stroke="${accent}"/>
  <text x="70" y="127" font-family="'IBM Plex Mono', monospace" font-size="11" fill="${accent}" letter-spacing="0.08em">${mode}</text>

  <!-- Category -->
  <text x="60" y="192" font-family="'IBM Plex Sans', sans-serif" font-size="14" fill="#6F6D63" letter-spacing="0.05em">${cat.toUpperCase()}</text>

  <!-- Title -->
  <foreignObject x="60" y="210" width="1080" height="180">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Newsreader', Georgia, serif; font-size: 52px; line-height: 1.2; color: #F4F2EA; word-wrap: break-word;">${title}</div>
  </foreignObject>

  <!-- Dek -->
  <foreignObject x="60" y="420" width="900" height="100">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'IBM Plex Sans', sans-serif; font-size: 22px; line-height: 1.4; color: #9A988F;">${dek}</div>
  </foreignObject>

  <!-- Source -->
  <text x="60" y="575" font-family="'IBM Plex Mono', monospace" font-size="13" fill="#6F6D63">Source: ${escapeXml(manifest.source.name)}</text>
</svg>`;
}

export async function svgToPng(svg: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
