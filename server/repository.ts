/**
 * Read models: turns kmfri_services_db rows into the shapes the React site
 * renders (src/types/index.ts).
 */
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from './db';
import type { ServiceItem, ResearchStation, CharterEntry, VesselSpec, DatasetEntry } from '../src/types';

// service_categories.slug -> site category key (drives icons & directory filters)
const CATEGORY_KEY: Record<string, ServiceItem['category']> = {
  'analytical-laboratories': 'analytical',
  'advisory-consultancy': 'consultancy',
  'aquaculture-seed': 'aquaculture',
  'marine-data': 'data',
  'vessel-hire': 'vessel',
  'value-addition': 'value_addition',
  'education-tours': 'education',
  'professional-training': 'training',
  'conference-facilities': 'facilities',
  'student-attachments': 'internship',
};

const groupBy = <T extends RowDataPacket>(rows: T[], key: string) => {
  const m = new Map<number, T[]>();
  for (const r of rows) {
    const k = r[key] as number;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  return m;
};

const stationSlug = (code: string) => code.toLowerCase();

export async function listServices(): Promise<ServiceItem[]> {
  const [services] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, sc.name AS category_name, sc.slug AS category_slug
       FROM services s JOIN service_categories sc ON sc.id = s.category_id
      ORDER BY s.display_order, s.id`
  );
  const [tiers] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM pricing_tiers WHERE is_active = 1 ORDER BY display_order, id`
  );
  const [caps] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM service_capabilities ORDER BY display_order, id`
  );
  const [reqs] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM service_requirements ORDER BY display_order, id`
  );
  const [stations] = await pool.query<RowDataPacket[]>(
    `SELECT sm.service_id, sm.is_lead_centre, rs.name
       FROM service_stations_map sm JOIN research_stations rs ON rs.id = sm.station_id
      ORDER BY sm.is_lead_centre DESC, rs.id`
  );
  const [vessels] = await pool.query<RowDataPacket[]>(`SELECT * FROM research_vessels ORDER BY length_metres DESC`);
  const [datasets] = await pool.query<RowDataPacket[]>(`SELECT * FROM scientific_datasets ORDER BY id`);
  const vesselSpecs: VesselSpec[] = vessels.map((v) => ({
    name: v.vessel_name,
    homePort: v.home_port,
    lengthMetres: Number(v.length_metres),
    grossTonnage: v.gross_tonnage,
    enduranceDays: v.endurance_days,
    scientistBerths: v.scientist_berths,
    cruiseSpeedKnots: Number(v.cruise_speed_knots),
    gear: v.primary_scientific_gear,
    rateKES: Number(v.charter_rate_kes_per_day),
    rateUSD: Number(v.charter_rate_usd_per_day),
    status: v.status,
  }));
  const datasetEntries: DatasetEntry[] = datasets.map((d) => ({
    code: d.dataset_code,
    title: d.dataset_title,
    coverage: d.coverage_area,
    resolution: d.spatial_resolution,
    temporalRange: d.temporal_range,
    format: d.data_format,
    tariffKES: Number(d.tariff_kes),
    academicKES: Number(d.academic_concession_kes),
    curatingCentre: d.curating_centre,
  }));

  const tiersBy = groupBy(tiers, 'service_id');
  const capsBy = groupBy(caps, 'service_id');
  const reqsBy = groupBy(reqs, 'service_id');
  const stationsBy = groupBy(stations, 'service_id');

  return services.map((s) => ({
    id: String(s.id),
    dbId: s.id,
    slug: s.slug,
    code: s.code,
    title: s.title,
    category: CATEGORY_KEY[s.category_slug] ?? 'analytical',
    categoryLabel: s.category_name,
    description: s.short_description,
    fullOverview: s.full_overview,
    remarks: s.remarks,
    targetClients: String(s.remarks).split(',').map((x: string) => x.trim()).filter(Boolean),
    keyCapabilities: (capsBy.get(s.id) ?? []).map((c) =>
      c.equipment_used ? `${c.capability_title} — ${c.equipment_used}` : c.capability_title
    ),
    sampleRequirements: reqsBy.has(s.id)
      ? reqsBy.get(s.id)!.map((r) => `${r.requirement_title}: ${r.requirement_text}`)
      : undefined,
    turnaroundTime: s.turnaround_time,
    pricingTiers: (tiersBy.get(s.id) ?? []).map((t) => ({
      id: t.id,
      name: t.tier_name,
      unit: t.unit_description,
      costKES: Number(t.cost_kes),
      costUSD: t.cost_usd == null ? undefined : Number(t.cost_usd),
      turnaroundTime: t.turnaround_time,
    })),
    availableStations: (stationsBy.get(s.id) ?? []).map((st) => st.name),
    status: s.status,
    featuredImage: s.featured_image ?? '/images/vessel-aerial.webp',
    isoStandard: s.iso_standard ?? undefined,
    contactOfficer: { title: s.contact_officer_title, email: s.contact_email, phone: s.contact_phone },
    vessels: s.category_slug === 'vessel-hire' ? vesselSpecs : undefined,
    datasets: s.category_slug === 'marine-data' ? datasetEntries : undefined,
  }));
}

export async function listStations(): Promise<ResearchStation[]> {
  const [stations] = await pool.query<RowDataPacket[]>(`SELECT * FROM research_stations ORDER BY id`);
  const [facilities] = await pool.query<RowDataPacket[]>(`SELECT * FROM station_facilities ORDER BY id`);
  const [offered] = await pool.query<RowDataPacket[]>(
    `SELECT sm.station_id, s.title
       FROM service_stations_map sm JOIN services s ON s.id = sm.service_id
      ORDER BY s.display_order`
  );
  const facBy = groupBy(facilities, 'station_id');
  const offBy = groupBy(offered, 'station_id');

  return stations.map((st) => ({
    id: stationSlug(st.code),
    dbId: st.id,
    name: st.name,
    code: st.code,
    location: st.location,
    county: /county$/i.test(st.county) ? st.county : `${st.county} County`,
    description: st.description ?? '',
    primaryFocus: (facBy.get(st.id) ?? []).map((f) => f.facility_name),
    servicesOffered: (offBy.get(st.id) ?? []).map((o) => o.title),
    contactEmail: st.contact_email,
    phone: st.contact_phone,
    headOfStation: st.head_title ? `${st.head_of_station} (${st.head_title})` : st.head_of_station,
    coordinates: { lat: Number(st.latitude), lng: Number(st.longitude) },
  }));
}

export async function listCharter(): Promise<CharterEntry[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ch.*, s.code, s.slug
       FROM service_charter ch JOIN services s ON s.id = ch.service_id
      ORDER BY s.display_order, ch.id`
  );
  return rows.map((r) => ({
    serviceSlug: r.slug,
    serviceCode: r.code,
    serviceName: r.service_name,
    turnaroundTime: r.statutory_turnaround_time,
    feeSummary: r.official_fee_summary,
    responsibleOfficer: r.responsible_officer,
    redressChannel: r.redress_channel,
  }));
}
