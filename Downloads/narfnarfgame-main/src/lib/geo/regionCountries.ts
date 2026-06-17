import { REGIONS } from "@/game/data";

// ISO 3166-1 numeric codes used as the `id` on world-atlas TopoJSON features.
export const REGION_ISO_NUMERIC: Record<string, string | null> = {
  "na-west": "840",
  "na-gulf": "840",
  "sa-amazon": "076",
  "eu-west": "250",
  "af-sahel": "562",
  "me-gulf": "682",
  "as-south": "356",
  "as-east": "156",
  "oc-aus": "036",
  "arc-north": null,
};

export const REGION_COUNTRY_NAME: Record<string, string> = {
  "na-west": "United States",
  "na-gulf": "United States",
  "sa-amazon": "Brazil",
  "eu-west": "France",
  "af-sahel": "Niger",
  "me-gulf": "Saudi Arabia",
  "as-south": "India",
  "as-east": "China",
  "oc-aus": "Australia",
  "arc-north": "Arctic Shelf",
};

/** Real-world centroid (lat, lon) of each region's representative country. */
export const REGION_LATLON: Record<string, { lat: number; lon: number }> = {
  "na-west": { lat: 47.5, lon: -122.3 },   // Pacific Northwest (Seattle area)
  "na-gulf": { lat: 29.8, lon: -90.1 },    // Gulf Coast (New Orleans)
  "sa-amazon": { lat: -3.5, lon: -62.2 },  // Amazon Basin
  "eu-west": { lat: 48.85, lon: 2.35 },    // Paris
  "af-sahel": { lat: 14.5, lon: 6.0 },     // Sahel / Niger
  "me-gulf": { lat: 26.5, lon: 50.0 },     // Persian Gulf
  "as-south": { lat: 22.0, lon: 79.0 },    // India
  "as-east": { lat: 35.0, lon: 104.0 },    // China
  "oc-aus": { lat: -25.0, lon: 134.0 },    // Australia interior
  "arc-north": { lat: 82.0, lon: 0.0 },    // Arctic shelf
};

/** Game-space coords → real lat/long. */
export function regionLatLon(regionId: string): { lat: number; lon: number } {
  return REGION_LATLON[regionId] ?? { lat: 0, lon: 0 };
}

/** Lazy-loaded country polygons keyed by ISO-numeric id. Cached in module scope. */
let polygonsCache: Map<string, number[][][]> | null = null;
let loadingPromise: Promise<Map<string, number[][][]>> | null = null;

export async function loadCountryPolygons(): Promise<Map<string, number[][][]>> {
  if (polygonsCache) return polygonsCache;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const [topo, { feature }] = await Promise.all([
      import("world-atlas/countries-110m.json"),
      import("topojson-client"),
    ]);
    const fc = feature(topo as any, (topo as any).objects.countries) as any;
    const map = new Map<string, number[][][]>();
    for (const f of fc.features as any[]) {
      const id = String(f.id ?? "").padStart(3, "0");
      const rings: number[][][] = [];
      const g = f.geometry;
      if (!g) continue;
      if (g.type === "Polygon") {
        for (const ring of g.coordinates) rings.push(ring as number[][]);
      } else if (g.type === "MultiPolygon") {
        for (const poly of g.coordinates) {
          for (const ring of poly) rings.push(ring as number[][]);
        }
      }
      map.set(id, rings);
    }
    polygonsCache = map;
    return map;
  })();
  return loadingPromise;
}