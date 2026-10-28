export interface PricingTier {
  /** pricing_tiers.id when loaded from the database */
  id?: number;
  /** Register row of the catalogue service this tariff publishes (absent = portfolio rate) */
  registerNo?: number;
  name: string;
  unit: string;
  costKES: number;
  costUSD?: number;
  turnaroundTime: string;
}

export interface ServiceItem {
  id: string;
  /** services.id when loaded from the database */
  dbId?: number;
  slug: string;
  code: string;
  title: string;
  category: 'analytical' | 'consultancy' | 'aquaculture' | 'data' | 'vessel' | 'value_addition' | 'education' | 'training' | 'facilities' | 'internship';
  categoryLabel: string;
  description: string;
  fullOverview: string;
  remarks: string;
  targetClients: string[];
  keyCapabilities: string[];
  sampleRequirements?: string[];
  turnaroundTime: string;
  pricingTiers: PricingTier[];
  availableStations: string[];
  status: 'active' | 'coming_soon' | 'pilot';
  featuredImage: string;
  isoStandard?: string;
  contactOfficer: {
    title: string;
    email: string;
    phone: string;
  };
  /** Research fleet (vessel hire service only) */
  vessels?: VesselSpec[];
  /** KeNODC dataset catalogue (data service only) */
  datasets?: DatasetEntry[];
}

export interface VesselSpec {
  name: string;
  homePort: string;
  lengthMetres: number;
  grossTonnage: number;
  enduranceDays: number;
  scientistBerths: number;
  cruiseSpeedKnots: number;
  gear: string;
  rateKES: number;
  rateUSD: number;
  status: string;
}

export interface DatasetEntry {
  code: string;
  title: string;
  coverage: string;
  resolution: string;
  temporalRange: string;
  format: string;
  tariffKES: number;
  academicKES: number;
  curatingCentre: string;
}

export interface CharterEntry {
  serviceSlug: string;
  serviceCode: string;
  serviceName: string;
  turnaroundTime: string;
  feeSummary: string;
  responsibleOfficer: string;
  redressChannel: string;
}

export interface ResearchStation {
  id: string;
  /** research_stations.id when loaded from the database */
  dbId?: number;
  name: string;
  code: string;
  location: string;
  county: string;
  description: string;
  primaryFocus: string[];
  servicesOffered: string[];
  contactEmail: string;
  phone: string;
  headOfStation: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ServiceInquiry {
  referenceNumber: string;
  serviceId: string;
  serviceTitle: string;
  clientType: 'government' | 'county' | 'private' | 'researcher' | 'university' | 'sme' | 'individual';
  fullName: string;
  organization: string;
  kraPin?: string;
  email: string;
  phone: string;
  stationPreference: string;
  estimatedQuantity: number;
  notes: string;
  status: 'submitted' | 'under_review' | 'quotation_ready';
  createdAt: string;
  estimatedTotalKES: number;
}
