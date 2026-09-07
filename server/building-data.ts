export interface FlatData {
  unit: string;
  flat_number: number;
  area_sqft: number;
  owner: string;
  tax_status: 'PAID' | 'PENDING';
  encumbrance: 'CLEAR' | 'ENCUMBERED';
  registered: boolean;
}

export interface FloorData {
  floor_number: number;
  elevation_meters: number;
  flats: FlatData[];
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
  floors: FloorData[];
}

const OWNERS = [
  'Rajesh Kumar Sharma',
  'Priya Anand Deshmukh',
  'Arun Venkatraman Iyer',
  'Sunita Mahesh Patil',
  'Vikram Singh Rathore',
  'Anjali Krishnamurthy',
  'Deepak Nair',
  'Meera Kulkarni',
  'Sanjay Gupta',
  'Lakshmi Venkatesan',
];

const TAX_STATUSES: Array<'PAID' | 'PENDING'> = ['PAID', 'PAID', 'PAID', 'PAID', 'PENDING', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID'];

export function getBuildingData(): BuildingData {
  const floors: FloorData[] = [];

  for (let f = 1; f <= 5; f++) {
    const flats: FlatData[] = [];
    for (let flat = 0; flat < 2; flat++) {
      const flatNum = 400 + f * 2 + flat;
      const idx = (f - 1) * 2 + flat;
      flats.push({
        unit: `Flat ${flatNum}`,
        flat_number: flatNum,
        area_sqft: 850 + f * 25 + flat * 35,
        owner: OWNERS[idx],
        tax_status: TAX_STATUSES[idx],
        encumbrance: 'CLEAR',
        registered: true,
      });
    }
    floors.push({
      floor_number: f,
      elevation_meters: parseFloat((f * 3.2).toFixed(2)),
      flats,
    });
  }

  return {
    building_id: 'BLD-NGP-402A-001',
    building_name: 'Godavari Heights — Plot 402/A',
    total_floors: 5,
    flats_per_floor: 2,
    spatial_bounds: {
      min_lat: 21.1458,
      max_lat: 21.1462,
      min_lng: 79.0880,
      max_lng: 79.0884,
      base_altitude_m: 310,
      floor_height_m: 3.2,
    },
    floors,
  };
}
