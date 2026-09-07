import type { Plugin } from 'vite';
import { generateULPIN, type ULPINInput } from './ulpin-engine';
import { getBuildingData } from './building-data';

const STATE_DISTRICT_COORDS: Record<string, Record<string, { lat: number; lng: number }>> = {
  MH: {
    NGP: { lat: 21.1458, lng: 79.0882 },
    MUM: { lat: 19.076, lng: 72.8777 },
    PUN: { lat: 18.5204, lng: 73.8567 },
  },
  DL: {
    CND: { lat: 28.7041, lng: 77.1025 },
    NDL: { lat: 28.6139, lng: 77.209 },
  },
  KA: {
    BLR: { lat: 12.9716, lng: 77.5946 },
    MYS: { lat: 12.2958, lng: 76.6394 },
  },
  TN: {
    CEN: { lat: 13.0827, lng: 80.2707 },
    COI: { lat: 11.0168, lng: 76.9558 },
  },
  RJ: {
    JPR: { lat: 26.9124, lng: 75.7873 },
    JOD: { lat: 26.2389, lng: 73.0243 },
  },
  UP: {
    LKO: { lat: 26.8467, lng: 80.9462 },
    NOI: { lat: 28.5355, lng: 77.391 },
  },
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function readBody(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
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

            const latitude = body.latitude ?? coords.lat;
            const longitude = body.longitude ?? coords.lng;
            const floor_number = Math.max(1, Math.min(20, Number(body.floor_number) || 1));
            const flat_number = Number(body.flat_number) || 401;
            const floor_height_m = Number(body.floor_height_m) || 3.2;
            const owner_name = body.owner_name || '—';
            const survey_plot = body.survey_plot || '';
            const tax_status = body.property_tax_status || 'PAID';

            const input: ULPINInput = {
              latitude,
              longitude,
              state_code: stateCode,
              district_code: districtCode,
              floor_number,
              flat_number,
              floor_height_m,
            };

            const result = generateULPIN(input);

            const responseData = {
              success: true,
              ulpin: result.ulpin,
              spatial_hash: result.spatial_hash,
              metadata: {
                latitude,
                longitude,
                elevation_meters: result.elevation_meters,
                floor_number: result.floor_number,
                unit_number: result.unit_number,
                floor_height_m,
                timestamp: result.timestamp,
                total_area_sqft: 850 + floor_number * 25 + (flat_number % 2) * 35,
                owner_name,
                survey_plot,
                property_tax_status: tax_status,
                encumbrance_status: 'CLEAR',
                registration_date: new Date().toISOString().split('T')[0],
              },
            };

            const response = json(responseData);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(await response.text());
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Failed to generate ULPIN', detail: String(err) }));
          }
          return;
        }

        // GET /api/building-floors
        if (url === '/api/building-floors' && method === 'GET') {
          const data = getBuildingData();
          const response = json(data);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(await response.text());
          return;
        }

        // GET /api/osm-buildings?lat=...&lng=...
        if (url.startsWith('/api/osm-buildings') && method === 'GET') {
          try {
            const parsed = new URL(url, 'http://localhost');
            const lat = parseFloat(parsed.searchParams.get('lat') || '21.1458');
            const lng = parseFloat(parsed.searchParams.get('lng') || '79.0882');
            const delta = 0.0015;

            const latMin = lat - delta;
            const latMax = lat + delta;
            const lngMin = lng - delta;
            const lngMax = lng + delta;

            const overpassQuery = `[out:json];(way["building"](${latMin},${lngMin},${latMax},${lngMax}););out geom;`;
            const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

            const osmResponse = await fetch(overpassUrl, { headers: { 'User-Agent': 'Bhoomi3D/1.0' } });

            if (!osmResponse.ok) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Overpass API error', status: osmResponse.status }));
              return;
            }

            const osmData = await osmResponse.json();
            const buildings: Array<{
              id: number;
              levels: number | null;
              height: number | null;
              tags: Record<string, string>;
              geometry: Array<{ lat: number; lon: number }>;
            }> = [];

            if (osmData.elements) {
              for (const el of osmData.elements) {
                if (el.type === 'way' && el.geometry && el.geometry.length >= 3) {
                  const tags = el.tags || {};
                  buildings.push({
                    id: el.id,
                    levels: tags['building:levels'] ? parseInt(tags['building:levels'], 10) : null,
                    height: tags['height'] ? parseFloat(tags['height']) : null,
                    tags,
                    geometry: el.geometry.map((g: { lat: number; lon: number }) => ({ lat: g.lat, lon: g.lon })),
                  });
                }
              }
            }

            const responseData = {
              success: true,
              query: { lat, lng, latMin, latMax, lngMin, lngMax },
              count: buildings.length,
              buildings,
            };

            const response = json(responseData);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(await response.text());
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Failed to fetch OSM data', detail: String(err) }));
          }
          return;
        }

        // GET /api/lookup-ulpin/:code
        if (url.startsWith('/api/lookup-ulpin/') && method === 'GET') {
          const ulpin = url.replace('/api/lookup-ulpin/', '');
          const building = getBuildingData();
          const match = building.floors.flatMap(f => f.flats).find(flat =>
            ulpin.includes(`U${flat.flat_number}`)
          );

          if (match) {
            const floorNum = Math.floor((match.flat_number - 400) / 2);
            const responseData = {
              success: true,
              ulpin,
              metadata: {
                latitude: 21.1458,
                longitude: 79.0882,
                altitude: floorNum * 3.2,
                totalArea: match.area_sqft,
                ownerName: match.owner,
                propertyTaxStatus: match.tax_status,
                encumbranceStatus: match.encumbrance,
                registrationDate: new Date().toISOString().split('T')[0],
              },
            };
            const response = json(responseData);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(await response.text());
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'ULPIN not found' }));
          }
          return;
        }

        next();
      });
    },
  };
}
