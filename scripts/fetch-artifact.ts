#!/usr/bin/env tsx
/**
 * Shared fetch/transform/commit script for live and synced artifacts.
 * Usage: npx tsx scripts/fetch-artifact.ts <artifact-id>
 *
 * Each artifact's transform.ts exports a fetch() or transform() function.
 * This script dispatches to the right fetcher, validates output, writes
 * data.json, and updates lastFetched in manifest.json.
 */
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const FETCHERS: Record<string, () => Promise<unknown>> = {
  "earthquakes-live": fetchEarthquakes,
  "births-by-country": fetchBirths,
};

async function fetchEarthquakes(): Promise<unknown> {
  const url =
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
  console.log(`Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS fetch failed: ${res.status}`);
  const raw = await res.json();

  // Transform
  const now = Date.now();
  const events = (raw.features as Array<{
    id: string;
    properties: { mag: number; place: string; time: number; type: string };
    geometry: { coordinates: [number, number, number] };
  }>)
    .filter((f) => f.properties.mag != null && f.properties.type === "earthquake")
    .map((f) => ({
      id: f.id,
      magnitude: Math.round(f.properties.mag * 10) / 10,
      depth: Math.round(f.geometry.coordinates[2]),
      lat: Math.round(f.geometry.coordinates[1] * 1000) / 1000,
      lon: Math.round(f.geometry.coordinates[0] * 1000) / 1000,
      place: f.properties.place ?? "Unknown location",
      time: new Date(f.properties.time).toISOString(),
    }))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return { generated: new Date().toISOString(), count: events.length, events };
}

async function fetchBirths(): Promise<unknown> {
  // World Bank crude birth rate: SP.DYN.CBRT.IN (per 1000 people)
  const rateUrl =
    "https://api.worldbank.org/v2/country/all/indicator/SP.DYN.CBRT.IN?format=json&mrv=1&per_page=300";
  // World Bank population: SP.POP.TOTL
  const popUrl =
    "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrv=1&per_page=300";

  console.log("Fetching World Bank birth rate and population data...");
  const [rateRes, popRes] = await Promise.all([fetch(rateUrl), fetch(popUrl)]);
  if (!rateRes.ok) throw new Error(`World Bank birth rate fetch failed: ${rateRes.status}`);
  if (!popRes.ok) throw new Error(`World Bank population fetch failed: ${popRes.status}`);

  const [rateData, popData] = await Promise.all([rateRes.json(), popRes.json()]);
  const rates: Array<{ country: { id: string; value: string }; value: number | null; date: string }> =
    rateData[1] ?? [];
  const pops: Array<{ country: { id: string }; value: number | null }> = popData[1] ?? [];

  const popMap: Record<string, number> = {};
  pops.forEach((p) => {
    if (p.value != null) popMap[p.country.id] = p.value;
  });

  const countries = rates
    .filter((r) => r.value != null && r.country.id.length === 3)
    .map((r) => {
      const pop = popMap[r.country.id] ?? 0;
      const births = Math.round((pop * r.value!) / 1000);
      return {
        code: r.country.id,
        name: r.country.value,
        births,
        rate: r.value!,
        region: "Unknown",
        incomeGroup: "unknown",
      };
    })
    .filter((c) => c.births > 0);

  const totalBirths = countries.reduce((s, c) => s + c.births, 0);
  const year = parseInt(rates[0]?.date ?? "2022");

  return { year, totalBirths, countries };
}

async function updateManifestTimestamp(artifactId: string): Promise<void> {
  const manifestPath = join(ROOT, "src/artifacts", artifactId, "manifest.json");
  const raw = await readFile(manifestPath, "utf-8");
  const manifest = JSON.parse(raw);
  manifest.lastFetched = new Date().toISOString();
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
}

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: npx tsx scripts/fetch-artifact.ts <artifact-id>");
    process.exit(1);
  }

  const fetcher = FETCHERS[id];
  if (!fetcher) {
    console.error(`Unknown artifact: ${id}`);
    console.error(`Available: ${Object.keys(FETCHERS).join(", ")}`);
    process.exit(1);
  }

  try {
    const data = await fetcher();
    const outPath = join(ROOT, "src/artifacts", id, "data.json");
    await writeFile(outPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(`✓ Written: ${outPath}`);

    await updateManifestTimestamp(id);
    console.log(`✓ Updated lastFetched in manifest.json`);
  } catch (err) {
    console.error(`Fetch failed for ${id}:`, err);
    process.exit(1);
  }
}

main();
