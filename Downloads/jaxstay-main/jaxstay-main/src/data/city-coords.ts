// Approximate centroids for the cities JaxStay serves.
// Used to position sitter pins on the map and compute "distance from you".
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // NY
  "New York City|NY": { lat: 40.7128, lng: -74.006 },
  "Brooklyn|NY": { lat: 40.6782, lng: -73.9442 },
  "Queens|NY": { lat: 40.7282, lng: -73.7949 },
  "Buffalo|NY": { lat: 42.8864, lng: -78.8784 },
  "Rochester|NY": { lat: 43.1566, lng: -77.6088 },
  "Albany|NY": { lat: 42.6526, lng: -73.7562 },
  "Syracuse|NY": { lat: 43.0481, lng: -76.1474 },
  // CA
  "Los Angeles|CA": { lat: 34.0522, lng: -118.2437 },
  "San Francisco|CA": { lat: 37.7749, lng: -122.4194 },
  "San Diego|CA": { lat: 32.7157, lng: -117.1611 },
  "San Jose|CA": { lat: 37.3382, lng: -121.8863 },
  "Sacramento|CA": { lat: 38.5816, lng: -121.4944 },
  "Oakland|CA": { lat: 37.8044, lng: -122.2712 },
  "Santa Monica|CA": { lat: 34.0195, lng: -118.4912 },
  // CO
  "Denver|CO": { lat: 39.7392, lng: -104.9903 },
  "Boulder|CO": { lat: 40.015, lng: -105.2705 },
  "Colorado Springs|CO": { lat: 38.8339, lng: -104.8214 },
  "Fort Collins|CO": { lat: 40.5853, lng: -105.0844 },
  "Aurora|CO": { lat: 39.7294, lng: -104.8319 },
  "Lakewood|CO": { lat: 39.7047, lng: -105.0814 },
  // TX
  "Austin|TX": { lat: 30.2672, lng: -97.7431 },
  "Houston|TX": { lat: 29.7604, lng: -95.3698 },
  "Dallas|TX": { lat: 32.7767, lng: -96.797 },
  "San Antonio|TX": { lat: 29.4241, lng: -98.4936 },
  "Fort Worth|TX": { lat: 32.7555, lng: -97.3308 },
  "Plano|TX": { lat: 33.0198, lng: -96.6989 },
  "El Paso|TX": { lat: 31.7619, lng: -106.485 },
  // AL
  "Birmingham|AL": { lat: 33.5186, lng: -86.8104 },
  "Montgomery|AL": { lat: 32.3668, lng: -86.3 },
  "Mobile|AL": { lat: 30.6954, lng: -88.0399 },
  "Huntsville|AL": { lat: 34.7304, lng: -86.5861 },
  "Tuscaloosa|AL": { lat: 33.2098, lng: -87.5692 },
  "Auburn|AL": { lat: 32.6099, lng: -85.4808 },
  "Hoover|AL": { lat: 33.4054, lng: -86.8114 },
};

export function coordsFor(city: string | null | undefined, state: string | null | undefined) {
  if (!city || !state) return null;
  const key = `${city.trim()}|${state.trim().toUpperCase()}`;
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  // Case-insensitive fallback
  const lc = key.toLowerCase();
  for (const k of Object.keys(CITY_COORDS)) {
    if (k.toLowerCase() === lc) return CITY_COORDS[k];
  }
  return null;
}

// Haversine distance in miles
export function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const SERVICE_TYPES = [
  { key: "boarding", label: "Dog Boarding", desc: "Sitter hosts your dog at their home overnight" },
  { key: "house_sitting", label: "House Sitting", desc: "Sitter stays at your home" },
  { key: "drop_in", label: "Drop-in Visits", desc: "Quick check-ins at your home" },
  { key: "day_care", label: "Doggy Day Care", desc: "Daytime care at the sitter's home" },
  { key: "walking", label: "Dog Walking", desc: "Walks during the day" },
  { key: "training", label: "Dog Training", desc: "Behavior and obedience sessions" },
  { key: "transport", label: "Pet Transportation", desc: "Vet, groomer, or other drop-offs & pickups" },
] as const;

export const DISTANCE_TIERS = [
  { key: "tier_0_5", label: "0–5 miles", maxMiles: 5 },
  { key: "tier_6_15", label: "6–15 miles", maxMiles: 15 },
  { key: "tier_16_30", label: "16–30 miles", maxMiles: 30 },
  { key: "tier_31_50", label: "31–50 miles", maxMiles: 50 },
  { key: "tier_50_plus", label: "50+ miles (custom quote)", maxMiles: null as number | null },
] as const;

export type DistanceTierKey = (typeof DISTANCE_TIERS)[number]["key"];

export const TRIP_TYPES = [
  { key: "one_way", label: "One-way Drop-off" },
  { key: "round_trip", label: "Round Trip (same day)" },
  { key: "scheduled_return", label: "Scheduled Return Pickup (later date)" },
] as const;

export type TripTypeKey = (typeof TRIP_TYPES)[number]["key"];

export type ServiceKey = (typeof SERVICE_TYPES)[number]["key"];

export const DOG_SIZES = [
  { key: "small", label: "Small (0–15 lbs)", maxLbs: 15 },
  { key: "medium", label: "Medium (16–40 lbs)", maxLbs: 40 },
  { key: "large", label: "Large (41–100 lbs)", maxLbs: 100 },
  { key: "giant", label: "Giant (101+ lbs)", maxLbs: 200 },
] as const;

export type DogSize = (typeof DOG_SIZES)[number]["key"];
