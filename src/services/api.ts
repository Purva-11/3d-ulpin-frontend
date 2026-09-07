import axios from 'axios';

export interface ULPINRequest {
  stateCode: string;
  districtCode: string;
  surveyPlotNo: string;
  floorLevel: number;
  flatUnit: string;
}

export interface BuildingFlat {
  unit: string;
  flat_number: number;
  area_sqft: number;
  owner: string;
  tax_status: 'PAID' | 'PENDING';
  encumbrance: 'CLEAR' | 'ENCUMBERED';
  registered: boolean;
}

export interface BuildingFloor {
  floor_number: number;
  elevation_meters: number;
  flats: BuildingFlat[];
}

export interface BuildingData {
  building_id: string;
  building_name: string;
  total_floors: number;
  flats_per_floor: number;
  spatial_bounds: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
    base_altitude_m: number;
    floor_height_m: number;
  };
  floors: BuildingFloor[];
}

export interface ULPINResponse {
  ulpin: string;
  source: 'api' | 'mock';
  metadata: {
    latitude: number;
    longitude: number;
    altitude: number;
    totalArea: number;
    ownerName: string;
    propertyTaxStatus: 'PAID' | 'DUE';
    encumbranceStatus: 'CLEAR' | 'ENCUMBERED';
    registrationDate: string;
  };
}

const API_URL = '/api/generate-ulpin';
const API_LOOKUP_URL = '/api/lookup-ulpin';
const API_BUILDING_URL = '/api/building-floors';

const STATE_DISTRICT_COORDS: Record<
  string,
  Record<string, { lat: number; lng: number; alt: number }>
> = {
  MH: {
    NGP: { lat: 21.1458, lng: 79.0882, alt: 310 },
    MUM: { lat: 19.076, lng: 72.8777, alt: 14 },
    PUN: { lat: 18.5204, lng: 73.8567, alt: 560 },
  },
  DL: {
    CND: { lat: 28.7041, lng: 77.1025, alt: 216 },
    NDL: { lat: 28.6139, lng: 77.209, alt: 216 },
  },
  KA: {
    BLR: { lat: 12.9716, lng: 77.5946, alt: 920 },
    MYS: { lat: 12.2958, lng: 76.6394, alt: 763 },
  },
  TN: {
    CEN: { lat: 13.0827, lng: 80.2707, alt: 6 },
    COI: { lat: 11.0168, lng: 76.9558, alt: 411 },
  },
};

function generateMockULPIN(req: ULPINRequest): string {
  const statePart = req.stateCode.toUpperCase();
  const districtNum = String(Math.abs(hashCode(req.districtCode)) % 99).padStart(2, '0');
  const hexPart = (Math.random().toString(16).substring(2, 6).toUpperCase());
  const floorPart = `Z${String(req.floorLevel).padStart(2, '0')}`;
  const unitNum = req.flatUnit.replace(/\D/g, '');
  const unitPart = `U${unitNum.padStart(2, '0')}`;

  return `${statePart}${districtNum}-${hexPart}-${floorPart}-${unitPart}`;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function getCoordinates(stateCode: string, districtCode: string, floorLevel: number) {
  const state = STATE_DISTRICT_COORDS[stateCode] || STATE_DISTRICT_COORDS.MH;
  const coords = state[districtCode] || state.NGP || { lat: 21.1458, lng: 79.0882, alt: 310 };
  return {
    latitude: parseFloat((coords.lat + (Math.random() - 0.5) * 0.01).toFixed(6)),
    longitude: parseFloat((coords.lng + (Math.random() - 0.5) * 0.01).toFixed(6)),
    altitude: coords.alt + floorLevel * 3.2,
  };
}

function buildMockMetadata(req: ULPINRequest) {
  const coords = getCoordinates(req.stateCode, req.districtCode, req.floorLevel);
  const baseArea = 850 + (req.floorLevel * 25);
  const ownerNames = [
    'Rajesh Kumar Sharma',
    'Priya Anand Deshmukh',
    'Arun Venkatraman Iyer',
    'Sunita Mahesh Patil',
    'Vikram Singh Rathore',
    'Anjali Krishnamurthy',
  ];
  const ownerName = ownerNames[Math.abs(hashCode(req.surveyPlotNo + req.flatUnit)) % ownerNames.length];

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: parseFloat(coords.altitude.toFixed(2)),
    totalArea: baseArea + (Math.abs(hashCode(req.flatUnit)) % 80),
    ownerName,
    propertyTaxStatus: 'PAID' as const,
    encumbranceStatus: 'CLEAR' as const,
    registrationDate: new Date().toISOString().split('T')[0],
  };
}

function buildMockResponse(req: ULPINRequest): ULPINResponse {
  return {
    ulpin: generateMockULPIN(req),
    source: 'mock',
    metadata: buildMockMetadata(req),
  };
}

export async function generateULPIN(req: ULPINRequest): Promise<ULPINResponse> {
  const coords = getCoordinates(req.stateCode, req.districtCode, req.floorLevel);
  const flatNumber = parseInt(req.flatUnit.replace(/\D/g, ''), 10) || 401;

  const payload = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    state_code: req.stateCode,
    district_code: req.districtCode,
    floor_number: req.floorLevel,
    flat_number: flatNumber,
  };

  try {
    const response = await axios.post(API_URL, payload, {
      timeout: 3000,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.data && response.data.success && response.data.ulpin) {
      const meta = response.data.metadata;
      return {
        ulpin: response.data.ulpin,
        source: 'api',
        metadata: {
          latitude: meta.latitude,
          longitude: meta.longitude,
          altitude: meta.elevation_meters ?? req.floorLevel * 3.2,
          totalArea: meta.total_area_sqft ?? 850 + req.floorLevel * 25,
          ownerName: meta.owner_name ?? '—',
          propertyTaxStatus: (meta.property_tax_status ?? 'PAID') as 'PAID' | 'DUE',
          encumbranceStatus: (meta.encumbrance_status ?? 'CLEAR') as 'CLEAR' | 'ENCUMBERED',
          registrationDate: meta.registration_date ?? new Date().toISOString().split('T')[0],
        },
      };
    }
    return buildMockResponse(req);
  } catch {
    return buildMockResponse(req);
  }
}

export async function lookupULPIN(ulpin: string): Promise<ULPINResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await axios.get(`${API_LOOKUP_URL}/${ulpin}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (response.data && response.data.success) return response.data as ULPINResponse;
    return null;
  } catch {
    return null;
  }
}

export async function fetchBuildingData(): Promise<BuildingData | null> {
  try {
    const response = await axios.get(API_BUILDING_URL, { timeout: 3000 });
    if (response.data) return response.data as BuildingData;
    return null;
  } catch {
    return null;
  }
}


