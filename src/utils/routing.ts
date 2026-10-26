/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransportType } from '../types/footprint';

export interface RouteSegmentResult {
  coordinates: [number, number][]; // [lat, lon]
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Maps transport type to OSRM routing profile
 */
export function getOsrmProfile(transportType: TransportType): 'driving' | 'bike' | 'foot' {
  if (transportType === 'walking') {
    return 'foot';
  }
  if (transportType === 'bicycle') {
    return 'bike';
  }
  return 'driving';
}

/**
 * Fetch route along actual roads from OSRM
 */
export async function fetchRoadRoute(
  waypoints: { lat: number; lon: number }[],
  transportType: TransportType
): Promise<RouteSegmentResult> {
  if (waypoints.length < 2) {
    return {
      coordinates: waypoints.map((w) => [w.lat, w.lon]),
      distanceMeters: 0,
      durationSeconds: 0,
    };
  }

  const profile = getOsrmProfile(transportType);
  // OSRM coordinates format: lon,lat;lon,lat;...
  const coordsParam = waypoints.map((w) => `${w.lon.toFixed(6)},${w.lat.toFixed(6)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsParam}?overview=full&geometries=geojson&steps=false`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`OSRM API error: ${res.status}`);
    }

    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const primaryRoute = data.routes[0];
      // geometry coordinates are [lon, lat]
      const coords: [number, number][] = primaryRoute.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );
      return {
        coordinates: coords,
        distanceMeters: primaryRoute.distance,
        durationSeconds: primaryRoute.duration,
      };
    } else {
      throw new Error(data.message || '無合適路徑');
    }
  } catch (err) {
    console.warn('Road routing API unavailable, falling back to direct geometric path:', err);
    // Fallback: interpolate points directly
    return fallbackInterpolateWaypoints(waypoints);
  }
}

function fallbackInterpolateWaypoints(
  waypoints: { lat: number; lon: number }[]
): RouteSegmentResult {
  const result: [number, number][] = [];
  let totalDistance = 0;

  for (let i = 0; i < waypoints.length; i++) {
    const curr = waypoints[i];
    result.push([curr.lat, curr.lon]);

    if (i < waypoints.length - 1) {
      const next = waypoints[i + 1];
      const dLat = next.lat - curr.lat;
      const dLon = next.lon - curr.lon;
      const stepCount = 5;
      for (let s = 1; s < stepCount; s++) {
        const factor = s / stepCount;
        result.push([curr.lat + dLat * factor, curr.lon + dLon * factor]);
      }
      // rough distance in meters
      const latMid = (curr.lat + next.lat) / 2;
      const mLat = 111139 * Math.abs(dLat);
      const mLon = 111139 * Math.cos((latMid * Math.PI) / 180) * Math.abs(dLon);
      totalDistance += Math.sqrt(mLat * mLat + mLon * mLon);
    }
  }

  return {
    coordinates: result,
    distanceMeters: Math.round(totalDistance),
    durationSeconds: Math.round(totalDistance / 10),
  };
}
