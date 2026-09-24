import { create } from 'zustand';

export type TaxStatus = 'PAID' | 'PENDING';
export type EncumbranceStatus = 'CLEAR' | 'MORTGAGED';

export interface ULPINResult {
  ulpin: string;
  source: 'api' | 'mock';
  spatialHash: string;
  elevationMeters: number;
  altitudeMSL: number;
  latitude: number;
  longitude: number;
  totalArea: number;
  ownerName: string;
  surveyPlot: string;
  taxStatus: TaxStatus;
  encumbranceStatus: EncumbranceStatus;
  registrationDate: string;
  floorNumber: number;
  flatNumber: number;
}

export interface OSMFootprintData {
  polygon: number[][] | null;
  levels: number | null;
  height: number | null;
  buildingCount: number;
}

interface AppState {
  // Form
  stateCode: string;
  districtCode: string;
  surveyPlot: string;
  latitude: number;
  longitude: number;
  totalFloors: number;
  floorHeightM: number;
  floorLevel: number;
  flatUnit: string;
  ownerName: string;
  taxStatus: TaxStatus;

  // 3D
  selectedFloor: number;
  hoveredFloor: number | null;
  cutawayMode: boolean;
  focusTrigger: number;

  // OSM
  useOSM: boolean;
  osmLoading: boolean;
  osmError: string | null;
  osmFootprint: number[][] | null;
  osmLevels: number | null;
  osmBuildingCount: number;

  // Result
  loading: boolean;
  result: ULPINResult | null;
  copied: boolean;
  toast: string | null;

  // Search
  searchLoading: boolean;
  searchResult: string | null;

  // Actions
  setForm: (partial: Partial<AppState>) => void;
  selectFloor: (index: number) => void;
  setHovered: (index: number | null) => void;
  toggleCutaway: () => void;
  triggerFocus: () => void;
  setResult: (r: ULPINResult | null) => void;
  setLoading: (v: boolean) => void;
  setCopied: (v: boolean) => void;
  setToast: (msg: string | null) => void;
  setOSM: (partial: Partial<Pick<AppState, 'useOSM' | 'osmLoading' | 'osmError' | 'osmFootprint' | 'osmLevels' | 'osmBuildingCount'>>) => void;
  setSearch: (loading: boolean, result: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  stateCode: 'MH',
  districtCode: 'NGP',
  surveyPlot: 'PLOT-402',
  latitude: 21.1458,
  longitude: 79.0882,
  totalFloors: 5,
  floorHeightM: 3.2,
  floorLevel: 4,
  flatUnit: '402',
  ownerName: 'Rahul Sharma',
  taxStatus: 'PAID',

  selectedFloor: 3,
  hoveredFloor: null,
  cutawayMode: false,
  focusTrigger: 0,

  useOSM: false,
  osmLoading: false,
  osmError: null,
  osmFootprint: null,
  osmLevels: null,
  osmBuildingCount: 0,

  loading: false,
  result: null,
  copied: false,
  toast: null,

  searchLoading: false,
  searchResult: null,

  setForm: (partial) => set(partial),
  selectFloor: (index) => set((s) => ({ selectedFloor: index, floorLevel: index + 1 })),
  setHovered: (index) => set({ hoveredFloor: index }),
  toggleCutaway: () => set((s) => ({ cutawayMode: !s.cutawayMode })),
  triggerFocus: () => set((s) => ({ focusTrigger: s.focusTrigger + 1 })),
  setResult: (r) => set({ result: r }),
  setLoading: (v) => set({ loading: v }),
  setCopied: (v) => set({ copied: v }),
  setToast: (msg) => {
    set({ toast: msg });
    if (msg) setTimeout(() => set({ toast: null }), 3000);
  },
  setOSM: (partial) => set(partial),
  setSearch: (loading, result) => set({ searchLoading: loading, searchResult: result }),
}));
