/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrackPoint, TransportCategory, TransportType } from '../types/footprint';

export interface GenerateGpxOptions {
  name: string;
  category: TransportCategory;
  transportType: TransportType;
  customTransportName?: string;
  startDateTime: string; // ISO string or YYYY-MM-DDTHH:mm
  points: { lat: number; lon: number; ele?: number }[];
}

export function generateGpxXml(options: GenerateGpxOptions): string {
  const { name, category, transportType, customTransportName, startDateTime, points } = options;

  const startDate = new Date(startDateTime);
  const baseTime = isNaN(startDate.getTime()) ? new Date() : startDate;

  // Determine realistic average speed in m/s for synthesizing timestamps
  let speedMps = 1.2; // walking
  if (transportType === 'bicycle') speedMps = 4.2;
  else if (transportType === 'motorcycle') speedMps = 10;
  else if (transportType === 'car') speedMps = 14;
  else if (['bus', 'mrt', 'light_rail'].includes(transportType)) speedMps = 11;
  else if (transportType === 'railway') speedMps = 20;
  else if (transportType === 'hsr') speedMps = 65;
  else if (transportType === 'plane') speedMps = 220;
  else if (transportType === 'ship') speedMps = 8;

  let currentTimestamp = baseTime.getTime();

  let trkptsXml = '';
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];

    if (i > 0) {
      const prev = points[i - 1];
      // calculate rough delta distance
      const dLat = ((pt.lat - prev.lat) * Math.PI) / 180;
      const dLon = ((pt.lon - prev.lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((prev.lat * Math.PI) / 180) *
          Math.cos((pt.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const dist = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const deltaSec = Math.max(1, Math.round(dist / speedMps));
      currentTimestamp += deltaSec * 1000;
    }

    const isoTime = new Date(currentTimestamp).toISOString();
    const eleXml = pt.ele !== undefined ? `\n        <ele>${pt.ele.toFixed(1)}</ele>` : '';

    trkptsXml += `      <trkpt lat="${pt.lat.toFixed(6)}" lon="${pt.lon.toFixed(6)}">${eleXml}
        <time>${isoTime}</time>
      </trkpt>\n`;
  }

  const typeLabel = transportType === 'custom' && customTransportName
    ? customTransportName
    : `${category}_${transportType}`;

  const safeName = name.replace(/[<>&]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      default: return c;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MyFootprints" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${safeName}</name>
    <time>${baseTime.toISOString()}</time>
  </metadata>
  <trk>
    <name>${safeName}</name>
    <type>${typeLabel}</type>
    <trkseg>
${trkptsXml}    </trkseg>
  </trk>
</gpx>`;
}
