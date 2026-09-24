import axios from 'axios';
import type { ULPINResult, TaxStatus, EncumbranceStatus } from '@/store';

const API_URL = '/api/generate-ulpin';
const API_LOOKUP_URL = '/api/lookup-ulpin';
const API_BUILDING_URL = '/api/building-floors';
const API_OSM_URL = '/api/osm-footprint';

const STATE_DISTRICT_COORDS: Record<string, Record<string, { lat: number; lng: number; alt: number }>> = {
  MH: { NGP: { lat: 21.1458, lng: 79.0882, alt: 310 }, MUM: { lat: 19.076, lng: 72.8777, alt: 14 }, PUN: { lat: 18.5204, lng: 73.8567, alt: 560 } },
  DL: { CND: { lat: 28.7041, lng: 77.1025, alt: 216 }, NDL: { lat: 28.6139, lng: 77.209, alt: 216 } },
  KA: { BLR: { lat: 12.9716, lng: 77.5946, alt: 920 }, MYS: { lat: 12.2958, lng: 76.6394, alt: 763 } },
  TN: { CEN: { lat: 13.0827, lng: 80.2707, alt: 6 }, COI: { lat: 11.0168, lng: 76.9558, alt: 411 } },
};

// Client-side MD5 fallback using a simple hash (not crypto-grade, but deterministic)
function clientMD5Short(lat: number, lng: number): string {
  const str = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  let h1 = 0x811c9dc5, h2 = 0x1000193;
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= str.charCodeAt(i) + 1;
    h2 = Math.imul(h2, 0x01000193);
  }
  const hex = (Math.abs(h1).toString(16) + Math.abs(h2).toString(16)).substring(0, 6);
  return hex.toUpperCase().padStart(6, '0');
}

function clientDistrictNum(code: string): string {
  let h = 0;
  for (let i = 0; i < code.length; i++) { h = (h << 5) - h + code.charCodeAt(i); h |= 0; }
  return String(Math.abs(h) % 99 + 1).padStart(2, '0');
}

export interface GenerateParams {
  stateCode: string;
  districtCode: string;
  surveyPlot: string;
  lat: number;
  lng: number;
  floorNumber: number;
  flatNumber: number;
  floorHeight: number;
  ownerName: string;
  taxStatus: TaxStatus;
}

function clientGenerate(params: GenerateParams): ULPINResult {
  const { stateCode, districtCode, lat, lng, floorNumber, flatNumber, floorHeight, ownerName, surveyPlot, taxStatus } = params;
  const statePart = stateCode.toUpperCase().padEnd(2, '0').slice(0, 2);
  const distPart = clientDistrictNum(districtCode);
  const spatialHash = clientMD5Short(lat, lng);
  const floorTag = `Z${String(floorNumber).padStart(2, '0')}`;
  const unitTag = `U${String(flatNumber).padStart(3, '0')}`;
  const ulpin = `${statePart}${distPart}-${spatialHash}-${floorTag}-${unitTag}`;

  const coords = STATE_DISTRICT_COORDS[stateCode]?.[districtCode] || STATE_DISTRICT_COORDS.MH.NGP;
  const baseAlt = coords.alt;
  const elevation = parseFloat((floorNumber * floorHeight).toFixed(2));
  const altitudeMSL = parseFloat((baseAlt + elevation).toFixed(2));

  return {
    ulpin, source: 'mock', spatialHash,
    elevationMeters: elevation, altitudeMSL,
    latitude: lat, longitude: lng,
    totalArea: 850 + floorNumber * 25 + (flatNumber % 2) * 35,
    ownerName, surveyPlot, taxStatus,
    encumbranceStatus: 'CLEAR' as EncumbranceStatus,
    registrationDate: new Date().toISOString().split('T')[0],
    floorNumber, flatNumber,
  };
}

export async function generateULPIN(params: GenerateParams): Promise<ULPINResult> {
  const payload = {
    state_code: params.stateCode,
    district_code: params.districtCode,
    survey_plot: params.surveyPlot,
    lat: params.lat,
    lng: params.lng,
    floor_number: params.floorNumber,
    flat_number: params.flatNumber,
    floor_height: params.floorHeight,
    owner_name: params.ownerName,
    tax_status: params.taxStatus,
  };

  try {
    const response = await axios.post(API_URL, payload, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
    if (response.data?.success && response.data.ulpin) {
      const m = response.data.metadata;
      return {
        ulpin: response.data.ulpin,
        source: 'api',
        spatialHash: response.data.spatial_hash,
        elevationMeters: m.elevation_meters,
        altitudeMSL: m.altitude_msl,
        latitude: m.latitude, longitude: m.longitude,
        totalArea: m.total_area_sqft,
        ownerName: m.owner_name, surveyPlot: m.survey_plot,
        taxStatus: m.tax_status as TaxStatus,
        encumbranceStatus: (m.encumbrance_status || 'CLEAR') as EncumbranceStatus,
        registrationDate: m.registration_date,
        floorNumber: m.floor_number, flatNumber: m.unit_number,
      };
    }
    return clientGenerate(params);
  } catch {
    return clientGenerate(params);
  }
}

export interface LookupResult {
  ulpin: string;
  ownerName: string;
  floorNumber: number;
  elevationMeters: number;
}

export async function lookupULPIN(ulpin: string): Promise<LookupResult | null> {
  try {
    const response = await axios.get(`${API_LOOKUP_URL}/${ulpin}`, { timeout: 3000 });
    if (response.data?.success) {
      const m = response.data.metadata;
      return {
        ulpin: response.data.ulpin,
        ownerName: m.owner_name || 'Unknown',
        floorNumber: m.floor_number || 0,
        elevationMeters: m.elevation_meters || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export interface OSMResponse {
  exists: boolean;
  default_levels?: number;
  default_height?: number;
  buildings?: Array<{ levels: number | null; height: number | null; geometry: Array<{ lat: number; lon: number }> }>;
  largest?: { levels: number | null; height: number | null; geometry: Array<{ lat: number; lon: number }> };
}

export async function fetchOSMFootprint(lat: number, lng: number): Promise<OSMResponse> {
  try {
    const response = await axios.post(API_OSM_URL, { lat, lng }, { timeout: 10000 });
    return response.data as OSMResponse;
  } catch {
    return { exists: false, default_levels: 5, default_height: 3.2 };
  }
}
