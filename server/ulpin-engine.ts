import { createHash } from 'crypto';

export interface ULPINInput {
  latitude: number;
  longitude: number;
  state_code: string;
  district_code: string;
  floor_number: number;
  flat_number: number;
  floor_height_m?: number;
}

export interface ULPINResult {
  ulpin: string;
  spatial_hash: string;
  elevation_meters: number;
  floor_number: number;
  unit_number: number;
  timestamp: string;
}

function md5ShortHash(lat: number, lng: number): string {
  const hash = createHash('md5').update(`${lat.toFixed(6)},${lng.toFixed(6)}`).digest('hex');
  return hash.substring(0, 6).toUpperCase();
}

function districtNumber(districtCode: string): string {
  let hash = 0;
  for (let i = 0; i < districtCode.length; i++) {
    hash = (hash << 5) - hash + districtCode.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 99 + 1).padStart(2, '0');
}

export function generateULPIN(input: ULPINInput): ULPINResult {
  const statePart = input.state_code.toUpperCase().padEnd(2, '0').slice(0, 2);
  const districtPart = districtNumber(input.district_code);
  const spatialHash = md5ShortHash(input.latitude, input.longitude);
  const floorTag = `Z${String(input.floor_number).padStart(2, '0')}`;
  const unitTag = `U${String(input.flat_number).padStart(3, '0')}`;

  const ulpin = `${statePart}${districtPart}-${spatialHash}-${floorTag}-${unitTag}`;
  const floorHeight = input.floor_height_m ?? 3.2;
  const elevation_meters = parseFloat((input.floor_number * floorHeight).toFixed(2));

  return {
    ulpin,
    spatial_hash: spatialHash,
    elevation_meters,
    floor_number: input.floor_number,
    unit_number: input.flat_number,
    timestamp: new Date().toISOString(),
  };
}
