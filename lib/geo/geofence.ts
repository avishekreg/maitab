export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export interface ExitTrackerSample {
  distanceMeters: number;
  at: number;
}

/**
 * Auto-settlement rule:
 * distance > bufferMeters AND distance increases continuously for sustainMs.
 */
export function shouldAutoSettle(
  samples: ExitTrackerSample[],
  bufferMeters = Number(process.env.GEO_FENCE_EXIT_METERS ?? 50),
  sustainMs = Number(process.env.GEO_FENCE_EXIT_SUSTAIN_MS ?? 180_000)
): boolean {
  if (samples.length < 2) return false;

  const latest = samples[samples.length - 1];
  if (latest.distanceMeters <= bufferMeters) return false;

  const windowStart = latest.at - sustainMs;
  const window = samples.filter((s) => s.at >= windowStart);
  if (window.length < 3) return false;
  if (window[0].at > windowStart + 15_000) return false;

  for (let i = 1; i < window.length; i += 1) {
    if (window[i].distanceMeters <= window[i - 1].distanceMeters) {
      return false;
    }
    if (window[i].distanceMeters <= bufferMeters) {
      return false;
    }
  }

  return true;
}

export function isWithinRadius(
  origin: GeoPoint,
  point: GeoPoint,
  radiusMeters: number
): boolean {
  return haversineMeters(origin, point) <= radiusMeters;
}
