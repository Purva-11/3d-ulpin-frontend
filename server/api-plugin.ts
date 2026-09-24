import type { Plugin } from 'vite';
import { generateULPIN, type ULPINInput } from './ulpin-engine';
import { getBuildingData } from './building-data';

const STATE_DISTRICT_COORDS: Record<string, Record<string, { lat: number; lng: number; base_alt: number }>> = {
  MH: {
    NGP: { lat: 21.1458, lng: 79.0882, base_alt: 310 },
    MUM: { lat: 19.076, lng: 72.8777, base_alt: 14 },
    PUN: { lat: 18.5204, lng: 73.8567, base_alt: 560 },
  },
  DL: {
    CND: { lat: 28.7041, lng: 77.1025, base_alt: 216 },
    NDL: { lat: 28.6139, lng: 77.209, base_alt: 216 },
  },
  KA: {
    BLR: { lat: 12.9716, lng: 77.5946, base_alt: 920 },
    MYS: { lat: 12.2958, lng: 76.6394, base_alt: 763 },
  },
  TN: {
    CEN: { lat: 13.0827, lng: 80.2707, base_alt: 6 },
    COI: { lat: 11.0168, lng: 76.9558, base_alt: 411 },
  },
  RJ: {
    JPR: { lat: 26.9124, lng: 75.7873, base_alt: 431 },
    JOD: { lat: 26.2389, lng: 73.0243, base_alt: 231 },
  },
  UP: {
    LKO: { lat: 26.8467, lng: 80.9462, base_alt: 123 },
    NOI: { lat: 28.5355, lng: 77.391, base_alt: 200 },
  },
};

// In-memory database
const db: Array<Record<string, unknown>> = [];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function readBody(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString());
}

export function apiPlugin(): Plugin {
  return {
    name: 'bhoomi-3d-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const method = req.method || 'GET';

        // POST /api/generate-ulpin
        if (url === '/api/generate-ulpin' && method === 'POST') {
          try {
            const body = await readBody(req);
            const stateCode = (body.state_code || 'MH').toUpperCase();
            const districtCode = (body.district_code || 'NGP').toUpperCase();
            const coords = STATE_DISTRICT_COORDS[stateCode]?.[districtCode] || STATE_DISTRICT_COORDS.MH.NGP;

            const latitude = body.lat ?? body.latitude ?? coords.lat;
            const longitude = body.lng ?? body.longitude ?? coords.lng;
            const floor_number = Math.max(1, Math.min(20, Number(body.floor_number) || 1));
            const flat_number = Number(body.flat_number) || 401;
            const floor_height_m = Number(body.floor_height) ?? Number(body.floor_height_m) ?? 3.2;
            const base_altitude_m = coords.base_alt;
            const owner_name = body.owner_name || '—';
            const survey_plot = body.survey_plot || '';
            const tax_status = body.tax_status || 'PAID';

            const input: ULPINInput = {
              latitude, longitude, state_code: stateCode, district_code: districtCode,
              floor_number, flat_number, floor_height_m, base_altitude_m,
            };

            const result = generateULPIN(input);

            const record = {
              ulpin: result.ulpin,
              latitude, longitude,
              elevation_meters: result.elevation_meters,
              altitude_msl: result.altitude_msl,
              floor_number, flat_number, owner_name, survey_plot, tax_status,
              created_at: result.timestamp,
            };
            db.push(record);

            const responseData = {
              success: true,
              ulpin: result.ulpin,
              spatial_hash: result.spatial_hash,
              metadata: {
                latitude, longitude,
                elevation_meters: result.elevation_meters,
                altitude_msl: result.altitude_msl,
                floor_number: result.floor_number,
                unit_number: result.unit_number,
                floor_height_m,
                timestamp: result.timestamp,
                total_area_sqft: 850 + floor_number * 25 + (flat_number % 2) * 35,
                owner_name, survey_plot, tax_status,
                encumbrance_status: 'CLEAR',
                registration_date: new Date().toISOString().split('T')[0],
              },
            };

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responseData));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Failed to generate ULPIN', detail: String(err) }));
          }
          return;
        }

        // GET /api/building-floors/:buildingId
        if (url.startsWith('/api/building-floors') && method === 'GET') {
          const parts = url.split('/');
          const buildingId = parts[3] || 'BLD-NGP-402A-001';
          const query = new URL(url, 'http://localhost');
          const totalFloors = parseInt(query.searchParams.get('floors') || '5', 10);
          const floorHeightM = parseFloat(query.searchParams.get('floor_height') || '3.2');
          const data = getBuildingData(buildingId, totalFloors, floorHeightM);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return;
        }

        // POST /api/osm-footprint
        if (url === '/api/osm-footprint' && method === 'POST') {
          try {
            const body = await readBody(req);
            const lat = Number(body.lat) || 21.1458;
            const lng = Number(body.lng) || 79.0882;
            const delta = 0.0015;
            const latMin = lat - delta, latMax = lat + delta;
            const lngMin = lng - delta, lngMax = lng + delta;

            const overpassQuery = `[out:json];(way["building"](${latMin},${lngMin},${latMax},${lngMax}););out geom;`;
            const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

            const osmResponse = await fetch(overpassUrl, { headers: { 'User-Agent': 'Bhoomi3D/1.0' } });

            if (!osmResponse.ok) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ exists: false, default_levels: 5, default_height: 3.2 }));
              return;
            }

            const osmData = await osmResponse.json();
            const buildings: any[] = [];

            if (osmData.elements) {
              for (const el of osmData.elements) {
                if (el.type === 'way' && el.geometry && el.geometry.length >= 3) {
                  buildings.push({
                    id: el.id,
                    levels: el.tags?.['building:levels'] ? parseInt(el.tags['building:levels'], 10) : null,
                    height: el.tags?.['height'] ? parseFloat(el.tags['height']) : null,
                    tags: el.tags || {},
                    geometry: el.geometry.map((g: any) => ({ lat: g.lat, lon: g.lon })),
                  });
                }
              }
            }

            if (buildings.length > 0) {
              const largest = buildings.reduce((a, b) =>
                (b.geometry.length > a.geometry.length) ? b : a
              );
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                exists: true,
                buildings,
                largest: {
                  levels: largest.levels,
                  height: largest.height,
                  geometry: largest.geometry,
                },
              }));
            } else {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ exists: false, default_levels: 5, default_height: 3.2 }));
            }
          } catch {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ exists: false, default_levels: 5, default_height: 3.2 }));
          }
          return;
        }

        // GET /api/lookup-ulpin/:code
        if (url.startsWith('/api/lookup-ulpin/') && method === 'GET') {
          const ulpin = url.replace('/api/lookup-ulpin/', '');
          const record = db.find((r) => (r.ulpin as string) === ulpin);
          if (record) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, ulpin, metadata: record }));
          } else {
            const building = getBuildingData();
            const match = building.floors.flatMap(f => f.flats).find(flat => ulpin.includes(`U${flat.flat_number}`));
            if (match) {
              const floorNum = Math.floor((match.flat_number - 400) / 2);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true, ulpin,
                metadata: {
                  latitude: 21.1458, longitude: 79.0882,
                  elevation_meters: floorNum * 3.2,
                  altitude_msl: 310 + floorNum * 3.2,
                  total_area_sqft: match.area_sqft,
                  owner_name: match.owner,
                  tax_status: match.tax_status,
                  encumbrance_status: match.encumbrance,
                  floor_number: floorNum,
                },
              }));
            } else {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'ULPIN not found' }));
            }
          }
          return;
        }

        next();
      });
    },
  };
}
