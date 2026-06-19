interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    depth?: number;
    type: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface USGSFeed {
  features: USGSFeature[];
}

export interface EarthquakeEvent {
  id: string;
  magnitude: number;
  depth: number;
  lat: number;
  lon: number;
  place: string;
  time: string;
}

export interface EarthquakesData {
  generated: string;
  count: number;
  events: EarthquakeEvent[];
}

export async function transform(raw: USGSFeed): Promise<EarthquakesData> {
  const events = raw.features
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

  return {
    generated: new Date().toISOString(),
    count: events.length,
    events,
  };
}
