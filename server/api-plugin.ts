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
    headers: { 'Content-Type': 'application/json' },
  });
}

export function apiPlugin(): Plugin {
  return {
    name: 'bhoomi-3d-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const method = req.method || 'GET';

        if (url === '/api/generate-ulpin' && method === 'POST') {
          try {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk as Buffer);
            }
            const body = JSON.parse(Buffer.concat(chunks).toString());

            const stateCode = (body.state_code || 'MH').toUpperCase();
            const districtCode = (body.district_code || 'NGP').toUpperCase();

            const coords =
              (STATE_DISTRICT_COORDS[stateCode]?.[districtCode]) ||
              STATE_DISTRICT_COORDS.MH.NGP;

            const latitude = body.latitude ?? coords.lat;
            const longitude = body.longitude ?? coords.lng;
            const floor_number = Math.max(1, Math.min(5, Number(body.floor_number) || 1));
            const flat_number = Number(body.flat_number) || 401;

            const input: ULPINInput = {
              latitude,
              longitude,
              state_code: stateCode,
              district_code: districtCode,
              floor_number,
              flat_number,
            };

            const result = generateULPIN(input);

            const ownerNames = [
              'Rajesh Kumar Sharma', 'Priya Anand Deshmukh', 'Arun Venkatraman Iyer',
              'Sunita Mahesh Patil', 'Vikram Singh Rathore', 'Anjali Krishnamurthy',
            ];
            const ownerIdx = Math.abs(floor_number * 7 + flat_number) % ownerNames.length;

            const responseData = {
              success: true,
              ulpin: result.ulpin,
              geohash: result.geohash,
              metadata: {
                latitude,
                longitude,
                elevation_meters: result.elevation_meters,
                floor_number: result.floor_number,
                unit_number: result.unit_number,
                timestamp: result.timestamp,
                total_area_sqft: 850 + floor_number * 25 + (flat_number % 2) * 35,
                owner_name: ownerNames[ownerIdx],
                property_tax_status: 'PAID',
                encumbrance_status: 'CLEAR',
                registration_date: new Date().toISOString().split('T')[0],
              },
            };

            const response = json(responseData);
            const text = await response.text();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Failed to generate ULPIN', detail: String(err) }));
          }
          return;
        }

        if (url === '/api/building-floors' && method === 'GET') {
          const data = getBuildingData();
          const response = json(data);
          const text = await response.text();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(text);
          return;
        }

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
            const text = await response.text();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
          } else {
            const response = json({ success: false, error: 'ULPIN not found' }, 404);
            const text = await response.text();
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
          }
          return;
        }

        next();
      });
    },
  };
}
