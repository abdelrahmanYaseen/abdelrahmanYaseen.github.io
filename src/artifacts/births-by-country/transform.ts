interface WorldBankEntry {
  country: { id: string; value: string };
  indicator: { id: string };
  value: number | null;
  date: string;
}

export interface CountryBirths {
  code: string;
  name: string;
  births: number;
  rate: number;
  region: string;
  incomeGroup: string;
}

export interface BirthsData {
  year: number;
  totalBirths: number;
  countries: CountryBirths[];
}

const REGION_MAP: Record<string, string> = {
  "East Asia & Pacific": "East Asia",
  "Europe & Central Asia": "Europe",
  "Latin America & Caribbean": "Latin America",
  "Middle East & North Africa": "MENA",
  "North America": "North America",
  "South Asia": "South Asia",
  "Sub-Saharan Africa": "Sub-Saharan Africa",
};

export async function transform(
  rawRates: [unknown, WorldBankEntry[]],
  populationMap: Record<string, number>
): Promise<BirthsData> {
  const entries = rawRates[1].filter((e) => e.value != null && e.country.id.length === 3);

  const countries: CountryBirths[] = entries.map((e) => {
    const pop = populationMap[e.country.id] ?? 0;
    const births = Math.round((pop * (e.value ?? 0)) / 1000);
    return {
      code: e.country.id,
      name: e.country.value,
      births,
      rate: e.value ?? 0,
      region: "Unknown",
      incomeGroup: "unknown",
    };
  });

  const totalBirths = countries.reduce((s, c) => s + c.births, 0);
  const year = parseInt(entries[0]?.date ?? "2022");

  return { year, totalBirths, countries };
}
