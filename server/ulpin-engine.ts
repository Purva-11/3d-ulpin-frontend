const GEOHASH_BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(lat: number, lng: number, precision = 6): string {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let result = '';
  let bit = 0;
  let ch = 0;
  let even = true;

  while (result.length < precision) {
    if (even) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) { ch |= (1 << (4 - bit)); minLng = mid; }
      else { maxLng = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { ch |= (1 << (4 - bit)); minLat = mid; }
      else { maxLat = mid; }
    }
    even = !even;
    bit++;
    if (bit === 5) {
      result += GEOHASH_BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return result;
}

export interface ULPINInput {
  latitude: number;
  longitude: number;
  state_code: string;
  district_code: string;
  floor_number: number;
  flat_number: number;
}

export interface ULPINResult {
  ulpin: string;
  geohash: string;
  elevation_meters: number;
  floor_number: number;
  unit_number: number;
  timestamp: string;
}

export function generateULPIN(input: ULPINInput): ULPINResult {
  const statePart = input.state_code.toUpperCase().padEnd(2, '0').slice(0, 2);
  const districtNum = String(Math.abs(hashStr(input.district_code)) % 99 + 1).padStart(2, '0');
  const geohash = encodeGeohash(input.latitude, input.longitude, 6).toUpperCase();
  const floorTag = `Z${String(input.floor_number).padStart(2, '0')}`;
  const unitTag = `U${String(input.flat_number).padStart(3, '0')}`;

  const ulpin = `${statePart}${districtNum}-${geohash}-${floorTag}-${unitTag}`;
  const elevation_meters = parseFloat((input.floor_number * 3.2).toFixed(2));

  return {
    ulpin,
    geohash,
    elevation_meters,
    floor_number: input.floor_number,
    unit_number: input.flat_number,
    timestamp: new Date().toISOString(),
  };
}

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
