export const STATES = [
  { code: "NY", name: "New York", cities: ["New York City", "Brooklyn", "Queens", "Buffalo", "Rochester", "Albany", "Syracuse"] },
  { code: "CA", name: "California", cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland", "Santa Monica"] },
  { code: "CO", name: "Colorado", cities: ["Denver", "Boulder", "Colorado Springs", "Fort Collins", "Aurora", "Lakewood"] },
  { code: "TX", name: "Texas", cities: ["Austin", "Houston", "Dallas", "San Antonio", "Fort Worth", "Plano", "El Paso"] },
  { code: "AL", name: "Alabama", cities: ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa", "Auburn", "Hoover"] },
] as const;

export const ALL_CITIES = STATES.flatMap((s) => s.cities.map((c) => ({ city: c, state: s.code, stateName: s.name })));
