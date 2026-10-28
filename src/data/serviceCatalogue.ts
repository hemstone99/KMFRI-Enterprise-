/**
 * KMFRI Service Catalogue — the single list of citizen-facing services, built from
 * "CITIZEN-FACING SERVICES" in the KMFRI services register (rows 44–167).
 *
 * Hierarchy:  Division  →  Service group  →  [Sub-group]  →  Service item
 *
 * Each division is one service portfolio (`serviceSlug`), whose scope, requirements and
 * contacts come from the services database. Groups keep the register's own section
 * headings in `registerLabel`. Online applications from the register's FINANCE section
 * sit in the division they apply for. Item names have obvious spelling slips corrected;
 * `no` is the row number in the register.
 */
import { ITEM_BLURBS } from './catalogueBlurbs';

export type Priority = 'High' | 'Medium' | 'Low';

export interface CatalogueItem {
  /** Row number in the KMFRI services register */
  no: number;
  name: string;
  /** One-line description for clients (catalogueBlurbs.ts) */
  blurb?: string;
  /** Official tariff in Kenya Shillings */
  feeKES?: number;
  /** Charging unit as stated in the register (per piece, per kg, per analyte …) */
  feeUnit?: string;
  /** Non-numeric tariff, e.g. "Free" */
  feeNote?: string;
  /** Register: "Digitized" */
  digitized: boolean;
  /** Register: "Onboarded" on the national eCitizen platform */
  onboarded: boolean;
  priority: Priority;
  /** Digitisation progress, % */
  progress: number;
  /** A digital platform that does not exist yet (as opposed to an office-delivered service) */
  planned?: boolean;
  /** Service portfolio that carries the quotation flow */
  serviceSlug?: string;
  note?: string;
}

export interface CatalogueNode {
  id: string;
  title: string;
  /** Heading exactly as written in the KMFRI register */
  registerLabel?: string;
  summary?: string;
  /** Longer introduction shown when the node is opened */
  highlight?: string;
  image?: string;
  serviceSlug?: string;
  items?: CatalogueItem[];
  children?: CatalogueNode[];
}

export interface CatalogueDivision extends CatalogueNode {
  /** Short marketing line for cards and banners */
  tagline: string;
  highlight: string;
  /** Reasons to choose KMFRI for this service */
  benefits: string[];
  /** Quality credentials that apply to the whole division */
  credentials?: string[];
  image: string;
  gallery: { src: string; alt: string }[];
  children: CatalogueNode[];
}

export type Availability = 'online' | 'partial' | 'office' | 'planned';

export const ECITIZEN_URL = 'https://kmfri.ecitizen.go.ke/';

export const availabilityOf = (item: CatalogueItem): Availability =>
  item.onboarded ? 'online' : item.digitized ? 'partial' : item.planned ? 'planned' : 'office';

/* ------------------------------------------------------------------ */

type Row = [no: number, name: string, feeKES?: number | null, extra?: Partial<CatalogueItem>];
type Base = Omit<CatalogueItem, 'no' | 'name'>;

const rows = (base: Base, list: Row[]): CatalogueItem[] =>
  list.map(([no, name, feeKES, extra]) => ({
    ...base,
    no,
    name,
    blurb: ITEM_BLURBS[no],
    ...(feeKES != null ? { feeKES } : {}),
    ...extra,
  }));

const LAB = 'laboratory-analytical-services';
const AQUA = 'fish-and-aquaculture-services';
const VISITS = 'educational-visits';
const VESSEL = 'research-vessel-hire-services';
const DATA = 'scientific-data-and-information-services';
const CONFERENCE = 'conference-and-meeting-facilities';
const ATTACHMENT = 'student-attachment-and-internship-services';

const offline = (priority: Priority = 'High'): Base => ({ digitized: false, onboarded: false, priority, progress: 0 });
const live: Base = { digitized: true, onboarded: true, priority: 'High', progress: 100 };
const medium = { priority: 'Medium' as Priority };
const low = { priority: 'Low' as Priority };

const LAB_QUALITY = ['ISO 9001:2015 certified', 'NEMA designated', 'ISO/IEC 17025:2017 accreditation in progress'];

export const SERVICE_CATALOGUE: CatalogueDivision[] = [
  {
    id: 'laboratory',
    title: 'Laboratory Analytical Services',
    registerLabel: 'LABORATORY FIELD WORK · LABORATORY BENCHTOP ANALYSIS',
    tagline: 'Know exactly what is in your water, fish, feed and sediment.',
    summary: 'In-situ field measurements and benchtop analysis of water, sediment, soil and biota at KMFRI laboratories.',
    highlight:
      'KMFRI runs a national network of marine and freshwater laboratories that test water quality, fish safety and freshness, feed nutrition, microbiology, heavy metals, microplastics and radioactivity. Choose single parameters at published per-test rates, or send a full sample list for a combined quotation. The same scientists who monitor Kenya’s oceans and lakes analyse your samples.',
    benefits: [
      'Published per-test tariffs — pay only for the parameters you need',
      'Field (in-situ) and benchtop analysis from one provider',
      'Results backed by KMFRI’s marine and freshwater scientists',
      'Apply online through eCitizen and track your request',
    ],
    credentials: LAB_QUALITY,
    serviceSlug: LAB,
    image: '/images/analytical-lab.webp',
    gallery: [
      { src: '/images/labs/icp-oes-spectrometer.webp', alt: 'ICP-OES spectrometer for heavy-metal analysis' },
      { src: '/images/labs/inverted-microscope.webp', alt: 'Inverted microscope for plankton and microbiology' },
      { src: '/images/labs/kjeldahl-nitrogen-analyzer.webp', alt: 'Kjeldahl nitrogen analyser for protein analysis' },
    ],
    children: [
      {
        id: 'lab-apply',
        title: 'Apply for Laboratory Analysis',
        summary: 'Start here: submit your laboratory request online on eCitizen.',
        serviceSlug: LAB,
        items: rows({ ...live, serviceSlug: LAB }, [
          [145, 'Application for laboratory analytical services'],
          [152, 'Application for laboratory analytical processes'],
        ]),
      },
      {
        id: 'lab-field',
        title: 'Field Work — In-situ Measurement',
        registerLabel: 'LABORATORY FIELD WORK (IN-SITU MEASUREMENT)',
        summary: 'Parameters measured on site with field probes and meters.',
        highlight:
          'KMFRI teams measure key water parameters directly at your pond, dam, river, creek or outfall, so the readings reflect real conditions without transport delays. Ideal for routine farm checks, environmental baselines and compliance monitoring.',
        image: '/images/coral-reef-survey.webp',
        serviceSlug: LAB,
        items: rows({ ...offline(), serviceSlug: LAB }, [
          [63, 'Temperature in water', 50],
          [64, 'pH in water', 50],
          [65, 'Dissolved oxygen (DO) in water', 50],
          [66, 'Transparency / turbidity in water', 50],
          [67, 'Conductivity in water', 50],
          [68, 'Total Dissolved Solids (TDS) in water', 50],
          [69, 'Chlorophyll-a, b, c in water', 50, medium],
          [70, 'Redox potential', 50],
          [71, 'Salinity in water', 50],
          [72, 'Noise and vibration detection (terrestrial)', 10000, { feeUnit: 'per day (hire)' }],
        ]),
      },
      {
        id: 'lab-water',
        title: 'Benchtop Analysis — Water',
        registerLabel: 'LABORATORY BENCHTOP ANALYSIS (WATER)',
        summary: 'Water chemistry, nutrients and organic load measured in the laboratory.',
        highlight:
          'Full laboratory water chemistry for fish farms, hatcheries, water utilities, industries and environmental consultants — from alkalinity and hardness to nutrients (nitrogen and phosphorus) and organic load (BOD, COD). Use it to manage pond productivity, prove effluent compliance or investigate pollution.',
        image: '/images/analytical-lab.webp',
        serviceSlug: LAB,
        items: rows({ ...offline(), serviceSlug: LAB }, [
          [73, 'Dissolved oxygen by Winkler', 1500],
          [74, 'Total alkalinity', 1500],
          [75, 'Carbonates (CO₃²⁻)', 800],
          [76, 'Bicarbonates (HCO₃⁻) anions', 800],
          [77, 'Water hardness (freshwater)', 1500],
          [78, 'Total Suspended Solids (TSS)', 1500],
          [79, 'Total Dissolved Solids (TDS)', 1500],
          [80, 'Turbidity', 1500],
          [81, 'Chlorophyll-a, b, c', 1500],
          [82, 'Nitrate nitrogen', 1500],
          [83, 'Nitrite nitrogen', 1500],
          [84, 'Soluble reactive silicate', 1500],
          [85, 'Iron III', 1300],
          [86, 'Sulphates', 1800],
          [87, 'Silicates', 1800],
          [88, 'Soluble reactive phosphorus', 1800],
          [89, 'Ammonium nitrogen (NH₄-N)', 1800],
          [90, 'Total ammonia', 1800],
          [91, 'Total phosphorus', 1800],
          [92, 'Biological Oxygen Demand (BOD)', 1500],
          [93, 'Chemical Oxygen Demand (COD)', 1500],
          [94, 'Total Organic Matter (TOM) / TOC', 1000],
          [95, 'Particulate Organic Matter (POM)', 1000],
          [96, 'Particulate Organic Carbon (POC)', 1500],
          [97, 'Fluorides', 1000],
        ]),
      },
      {
        id: 'lab-micro',
        title: 'Benchtop Analysis — Water, Sediment & Biota',
        registerLabel: 'LABORATORY BENCHTOP ANALYSIS (WATER, SEDIMENT, BIOTA)',
        summary: 'Microbiology and molecular genetics on any sample matrix.',
        highlight:
          'Hygiene and safety testing for drinking water, ice, seafood and processing plants, plus DNA extraction and PCR for species identification, pathogen detection and genetic studies.',
        image: '/images/labs/inverted-microscope.webp',
        serviceSlug: LAB,
        items: rows({ ...offline(), serviceSlug: LAB }, [
          [98, 'Total coliform count', 1800],
          [99, 'Faecal coliform', 1800],
          [100, 'Plate count', 1800],
          [101, 'E. coli', 2000],
          [102, 'Molecular genetics analysis (DNA extraction)', 2000, medium],
          [103, 'PCR amplification', 1500, medium],
        ]),
      },
      {
        id: 'lab-biota',
        title: 'Benchtop Analysis — Biota',
        registerLabel: 'LABORATORY BENCHTOP ANALYSIS (BIOTA)',
        summary: 'Fish quality, biochemical and nutritional analysis, and species identification.',
        highlight:
          'Everything fish processors, exporters, feed millers and nutritionists need: freshness and spoilage indices, fat oxidation, vitamins and fatty acids, full proximate (nutrition) analysis, and expert identification of fish and plankton.',
        image: '/images/labs/kjeldahl-nitrogen-analyzer.webp',
        serviceSlug: LAB,
        children: [
          {
            id: 'lab-biota-quality',
            title: 'Fish Quality & Freshness',
            summary: 'Grade freshness and predict shelf life of fresh, dried and smoked fish.',
            items: rows({ ...offline(), serviceSlug: LAB }, [
              [104, 'Water activity', 2000],
              [105, 'Total Volatile Bases (TVB)', 2000],
              [106, 'Total Volatile Nitrogen (TVN)', 2000],
              [107, 'Trimethylamine (TMA)', 2000],
            ]),
          },
          {
            id: 'lab-biota-biochemical',
            title: 'Biochemical Analysis',
            summary: 'Rancidity, vitamins, fatty acids and pollutant sample preparation.',
            items: rows({ ...offline(), serviceSlug: LAB }, [
              [108, 'PCBs in fish, soil, sediments and water — sample preparation', 16000, low],
              [109, 'Peroxide value (PV)', 2000, medium],
              [110, 'Total volatile basic nitrogen (T-VBN)', 2000, medium],
              [111, 'TBARS', 2000, medium],
              [112, 'Free fatty acids (FFA)', 3000, medium],
              [113, 'Vitamins (C, B1 and B6)', 4500],
              [114, 'Fatty acids', 5000],
            ]),
          },
          {
            id: 'lab-biota-proximate',
            title: 'Proximate Analysis',
            summary: 'The nutrition panel for fish, feeds and food products.',
            items: rows({ ...offline(), serviceSlug: LAB }, [
              [115, 'Total fats', 1500],
              [116, 'Moisture content', 1500],
              [117, 'Protein', 1800],
              [118, 'Ash content', 1500],
              [119, 'Crude fibre', 1800],
            ]),
          },
          {
            id: 'lab-biota-taxonomy',
            title: 'Taxonomy & Species Identification',
            summary: 'Expert identification of fish, plankton and benthic organisms.',
            image: '/images/labs/stereo-microscopy-bench.webp',
            items: rows({ ...offline(), serviceSlug: LAB }, [
              [120, 'Fish and other marine / freshwater species identification', 2000],
              [121, 'Phytoplankton microscopic identification & count', 2000],
              [122, 'Macro- and meiobenthos microscopic identification & count', 2000],
              [123, 'Zooplankton microscopic identification & count', 2000],
            ]),
          },
        ],
      },
      {
        id: 'lab-sediment',
        title: 'Benchtop Analysis — Sediment, Soil & Biota',
        registerLabel: 'LABORATORY BENCHTOP ANALYSIS (SEDIMENT/SOIL/BIOTA)',
        summary: 'Heavy metals, elemental and particle analysis, microplastics and radioisotopes.',
        highlight:
          'Advanced instrumentation for environmental impact assessments, dredging, mining, port and coastal projects: ICP-OES heavy metals priced per metal, CHNS and XRF elemental analysis, particle size, microplastic and polymer identification, and gamma, beta and alpha radioactivity.',
        image: '/images/labs/icp-oes-spectrometer.webp',
        serviceSlug: LAB,
        items: rows({ ...offline(), serviceSlug: LAB }, [
          [124, 'ICP-OES heavy metals in sediment, soil and biota (Cd, Cu, Pb, Fe, Al, Ni, Co, Hg, Zn, Mn, As)', 2000, { feeUnit: 'per analyte' }],
          [125, 'CHNS elemental analysis', 18000],
          [126, 'Particle size & shape analysis', 3000],
          [127, 'X-ray fluorescence (XRF) spectroscopy', 1000],
          [128, 'Micro / macroplastics microscopic identification', 2000],
          [129, 'Polymer identification (ATR)', 2000],
          [130, 'Gamma radioisotopes specific activity — biota/fish, water, sediments/soil', 5000, low],
          [131, 'Beta radioisotopes specific activity — biota/fish, water, sediments/soil', 10000, medium],
          [132, 'Alpha radioisotopes specific activity — biota/fish, water, sediments/soil', 10000, medium],
          [133, 'Alpha radioisotopes specific activity — biota/fish, water, sediments/soil', 20000, {
            ...medium,
            note: 'Listed twice in the register at different tariffs — confirm the applicable rate with the laboratory.',
          }],
        ]),
      },
    ],
  },
  {
    id: 'aquaculture',
    title: 'Aquaculture & Mariculture Products',
    registerLabel: 'MARICULTURE/AQUACULTURE',
    tagline: 'Quality fish seed, broodstock, feeds and ornamental fish from KMFRI hatcheries.',
    summary: 'Fingerlings, broodstock, ornamental fish and fish feeds from KMFRI hatcheries.',
    highlight:
      'Start, restock or scale up your fish farm with seed produced by Kenya’s aquaculture research institute. KMFRI hatcheries supply mixed-sex and all-male (monosex) tilapia, African catfish, broodstock for your own hatchery, ornamental fish for aquariums and ponds, and formulated feeds for every growth stage. Most products can be ordered online today.',
    benefits: [
      'Seed from KMFRI research hatcheries',
      'Monosex tilapia at half price for orders of 5,000 pieces or more',
      'Everything for the farm cycle — seed, broodstock and feed',
      'Order fingerlings, broodstock and ornamental fish online on eCitizen',
    ],
    serviceSlug: AQUA,
    image: '/images/aquaculture-hatchery.webp',
    gallery: [
      { src: '/images/kmfri/cage-culture.webp', alt: 'Fish cages in a KMFRI mariculture project' },
      { src: '/images/aquaculture-hatchery.webp', alt: 'Fingerlings being sampled at a KMFRI hatchery' },
    ],
    children: [
      {
        id: 'aqua-fingerlings',
        title: 'Fingerlings & Post-fingerlings',
        summary: 'Tilapia (mixed-sex and monosex) and catfish seed, priced per piece.',
        highlight:
          'Monosex (all-male) tilapia grow faster and more evenly than mixed-sex stock, giving a more uniform harvest. Post-fingerlings are larger and hardier, so more survive stocking. Bulk orders of monosex fingerlings cost half as much per piece.',
        image: '/images/aquaculture-hatchery.webp',
        serviceSlug: AQUA,
        items: rows({ ...live, feeUnit: 'per piece', serviceSlug: AQUA }, [
          [44, 'Mixed-sex tilapia fingerlings', 5],
          [45, 'Monosex tilapia fingerlings (1–5,000 pcs)', 10],
          [46, 'Monosex tilapia fingerlings (5,000–10,000 pcs)', 5],
          [47, 'Monosex tilapia fingerlings (above 10,000 pcs)', 5],
          [48, 'Tilapia post-fingerlings', 15],
          [49, 'Monosex tilapia post-fingerlings', 25],
          [50, 'Catfish post-fingerlings', 10],
          [51, 'Catfish fingerlings', 30],
        ]),
      },
      {
        id: 'aqua-broodstock',
        title: 'Broodstock & Table-size Fish',
        summary: 'Parent fish to start or renew your own hatchery.',
        serviceSlug: AQUA,
        items: rows({ ...live, priority: 'Medium', feeUnit: 'per piece', serviceSlug: AQUA }, [
          [52, 'Tilapia broodstock (80–200 g)', 250],
          [53, 'Catfish broodstock (250–500 g)', 300],
          [54, 'Catfish (500 g – 1.5 kg)', 400],
        ]),
      },
      {
        id: 'aqua-ornamental',
        title: 'Ornamental Fish',
        summary: 'Goldfish, koi, guppies and fantails for aquariums and ponds.',
        highlight:
          'Colourful, healthy ornamental fish for homes, offices, hotels, schools and garden ponds — the same species visitors admire in the KMFRI aquarium.',
        image: '/images/kmfri/aquarium-reef-tank.webp',
        serviceSlug: AQUA,
        items: rows({ ...live, serviceSlug: AQUA }, [
          [55, 'Goldfish', 150, { feeUnit: 'per piece' }],
          [56, 'Koi carp', 450, { feeUnit: 'per inch' }],
          [57, 'Guppies', 50, { feeUnit: 'per piece' }],
          [58, 'Fantail', 250, { feeUnit: 'per inch' }],
        ]),
      },
      {
        id: 'aqua-feeds',
        title: 'Fish Feeds & Artemia',
        summary: 'Formulated feeds for each growth stage, plus live-feed cysts.',
        highlight:
          'Match the feed to the stage: starter for fry, grower for juveniles and finisher before harvest. Artemia cysts hatch into live feed for larval fish and shrimp. Fish feeds can be ordered online on eCitizen.',
        image: '/images/kmfri/cage-culture.webp',
        serviceSlug: AQUA,
        items: [
          ...rows(live, [[151, 'Application for fish feeds', null, { serviceSlug: AQUA, note: 'Already live and in use.' }]]),
          ...rows({ ...offline(), feeUnit: 'per kg', serviceSlug: AQUA }, [
            [59, 'Starter feed', 250],
            [60, 'Grower feed', 200],
            [61, 'Finisher feed', 180],
            [62, 'Artemia cysts', 7000],
          ]),
        ],
      },
    ],
  },
  {
    id: 'maritime',
    title: 'Research Vessels & Diving',
    registerLabel: 'MARITIME',
    tagline: 'Take your survey to sea with Kenya’s national research fleet.',
    summary: 'Charter of KMFRI research vessels and hire of scientific diving equipment.',
    highlight:
      'KMFRI operates Kenya’s national research fleet, led by the oceanographic vessel RV Mtafiti, with RV Uvumbuzi and smaller boats for coastal and inland work. Charter a vessel for research cruises, fisheries and environmental surveys, cable and pipeline routes or training at sea, and hire scientific diving equipment for reef and underwater work.',
    benefits: [
      'Kenya’s national research fleet, led by RV Mtafiti',
      'Crewed vessels with onboard scientific support',
      'Scientific diving equipment for underwater surveys',
      'Coastal and inland (lake) operations',
    ],
    serviceSlug: VESSEL,
    image: '/images/kmfri/rv-mtafiti.webp',
    gallery: [
      { src: '/images/kmfri/rv-mtafiti.webp', alt: 'KMFRI research vessel RV Mtafiti at sea' },
      { src: '/images/kmfri/rv-uvumbuzi.webp', alt: 'KMFRI research vessel RV Uvumbuzi' },
      { src: '/images/labs/rov-deep-trekker.webp', alt: 'KMFRI underwater remotely operated vehicle' },
    ],
    children: [
      {
        id: 'maritime-hire',
        title: 'Vessel & Equipment Hire',
        summary: 'Research vessel charter and scientific diving gear.',
        serviceSlug: VESSEL,
        items: rows({ ...offline(), serviceSlug: VESSEL }, [
          [154, 'Hire of research vessels'],
          [153, 'Hire of diving equipment'],
        ]),
      },
    ],
  },
  {
    id: 'visits',
    title: 'Museum, Aquarium & Educational Visits',
    registerLabel: 'MUSEUM VISIT · EDUCATIONAL VISITS',
    tagline: 'Discover Kenya’s oceans and lakes — a day out that teaches.',
    summary: 'Guided visits to KMFRI laboratories, aquarium, museum, farms and hatcheries.',
    highlight:
      'Bring your class, family or team to see marine and freshwater science up close. The KMFRI museum displays coral, shell and preserved specimen collections; the aquarium shows living reef fish; and guided tours take groups through laboratories, fish farms and hatcheries with KMFRI scientists.',
    benefits: [
      'Free museum entry for Grade 3 and below',
      'Group tours from Ksh 2,000 for up to 50 visitors',
      'Laboratories, aquarium, museum, farms and hatchery in one visit',
      'Book educational visits online on eCitizen',
    ],
    serviceSlug: VISITS,
    image: '/images/kmfri/museum-exhibition-hall.webp',
    gallery: [
      { src: '/images/kmfri/aquarium-reef-tank.webp', alt: 'Reef fish in the KMFRI aquarium' },
      { src: '/images/kmfri/museum-specimen-jars.webp', alt: 'Preserved specimen collection in the KMFRI museum' },
      { src: '/images/kmfri/museum-coral-shells.webp', alt: 'Coral and shell display in the KMFRI museum' },
    ],
    children: [
      {
        id: 'visits-educational',
        title: 'Educational Group Visits',
        registerLabel: 'EDUCATIONAL VISITS (Lab, Aquarium, Museum, Farms, Hatchery)',
        summary: 'Guided tours of the laboratories, aquarium, museum, farms and hatchery.',
        highlight:
          'Ideal for schools, colleges, universities, clubs and corporate teams. A group fee covers a guided tour across KMFRI facilities, and bookings are made online.',
        image: '/images/kmfri/museum-interpretive.webp',
        serviceSlug: VISITS,
        items: [
          ...rows({ ...live, serviceSlug: VISITS }, [[146, 'Book an educational visit']]),
          ...rows({ ...live, progress: 0, feeUnit: 'per group', serviceSlug: VISITS }, [
            [137, 'Groups of 1–50 visitors', 2000],
            [138, 'Groups of 51–100 visitors', 4000],
            [139, 'Groups of over 100 visitors', 50, { feeUnit: 'per person' }],
          ]),
        ],
      },
      {
        id: 'visits-museum',
        title: 'Museum Visit',
        registerLabel: 'MUSEUM VISIT',
        summary: 'Walk-in entry to the KMFRI marine museum.',
        image: '/images/kmfri/museum-heritage.webp',
        serviceSlug: VISITS,
        items: rows({ ...offline(), feeUnit: 'per person', serviceSlug: VISITS }, [
          [134, 'Adults', 100],
          [135, 'Grade 4 to university students', 50],
          [136, 'Grade 3 and below', null, { feeUnit: undefined, feeNote: 'Free' }],
        ]),
      },
    ],
  },
  {
    id: 'conference',
    title: 'Conference & Meeting Facilities',
    tagline: 'Meet by the ocean — halls, boardrooms and grounds on KMFRI campuses.',
    summary: 'Conference halls, meeting rooms and grounds for hire.',
    highlight:
      'Host your workshop, training, board meeting or stakeholder forum in a calm scientific setting. KMFRI campuses offer conference halls, boardrooms and landscaped grounds, and conference bookings can be made online through eCitizen.',
    benefits: [
      'Venues on KMFRI campuses, including Mombasa headquarters by the harbour',
      'Halls, boardrooms and outdoor grounds',
      'Book and pay online on eCitizen',
    ],
    serviceSlug: CONFERENCE,
    image: '/images/kmfri/hq-harbour-view.webp',
    gallery: [
      { src: '/images/kmfri/hq-arcade.webp', alt: 'Arched entrance to a KMFRI headquarters building' },
      { src: '/images/kmfri/hq-campus-gardens.webp', alt: 'Gardens on the KMFRI Mombasa campus' },
      { src: '/images/kmfri/hq-harbour-view.webp', alt: 'KMFRI Mombasa campus overlooking the harbour' },
    ],
    children: [
      {
        id: 'conference-booking',
        title: 'Conference Booking & Facility Hire',
        summary: 'Reserve dates and hire facilities online.',
        serviceSlug: CONFERENCE,
        items: rows({ ...live, serviceSlug: CONFERENCE }, [
          [148, 'Conference booking'],
          [149, 'Hire of conference facilities'],
        ]),
      },
    ],
  },
  {
    id: 'attachment',
    title: 'Student Attachment & Internships',
    tagline: 'Learn marine and freshwater science alongside practising researchers.',
    summary: 'Industrial attachment and practical research placements.',
    highlight:
      'KMFRI hosts students from universities and colleges for industrial attachment in laboratories, research vessels, hatcheries and field stations across the country. Students gain hands-on experience under the mentorship of KMFRI scientists. Applications are made online.',
    benefits: [
      'Mentorship by practising research scientists',
      'Field, laboratory and hatchery exposure',
      'Placements at KMFRI centres nationwide',
      'Apply online on eCitizen',
    ],
    serviceSlug: ATTACHMENT,
    image: '/images/kmfri/hq-building.webp',
    gallery: [
      { src: '/images/kmfri/hq-building.webp', alt: 'KMFRI headquarters building in Mombasa' },
      { src: '/images/labs/stereo-microscopy-bench.webp', alt: 'Stereo microscopy bench in a KMFRI laboratory' },
    ],
    children: [
      {
        id: 'attachment-apply',
        title: 'Apply for Attachment',
        summary: 'Submit your attachment application online.',
        serviceSlug: ATTACHMENT,
        items: rows({ ...live, serviceSlug: ATTACHMENT }, [[150, 'Application for attachment']]),
      },
    ],
  },
  {
    id: 'research',
    title: 'Marine Data, Research & Partnerships',
    registerLabel: 'RESEARCH',
    tagline: 'Tide tables today; open research data and partnerships next.',
    summary: 'Tide tables, KMFRI research data, partnerships and public findings.',
    highlight:
      'KMFRI publishes the Kenya tide tables and holds decades of oceanographic, fisheries and environmental data. Tide tables can be applied for online now. Data portals, digital research agreements, partner onboarding and public dashboards are being developed so researchers, partners and communities can work with KMFRI directly.',
    benefits: [
      'Official tide tables, available online now',
      'Decades of marine and freshwater research data',
      'Partnerships with universities and research institutions',
    ],
    serviceSlug: DATA,
    image: '/images/ocean-surface.webp',
    gallery: [
      { src: '/images/kmfri/mangrove-planting.webp', alt: 'Community mangrove planting with KMFRI' },
      { src: '/images/ocean-surface.webp', alt: 'Ocean surface off the Kenyan coast' },
    ],
    children: [
      {
        id: 'research-tide-tables',
        title: 'Tide Tables',
        summary: 'Tide predictions for Kenyan ports and coastline.',
        serviceSlug: DATA,
        items: rows({ ...live, serviceSlug: DATA }, [[147, 'Application for tide tables']]),
      },
      {
        id: 'research-data',
        title: 'Research Data Management',
        registerLabel: 'Research data management',
        serviceSlug: DATA,
        items: rows({ ...offline(), planned: true, serviceSlug: DATA }, [
          [156, 'Institutional data repositories'],
          [157, 'Metadata catalogue'],
          [158, 'Data sharing and download portal'],
          [159, 'Version control for research datasets', null, medium],
        ]),
      },
      {
        id: 'research-admin',
        title: 'Research Administration',
        registerLabel: 'Research administration services',
        items: rows({ ...offline(), planned: true }, [[155, 'Digital MoU and research agreement processing']]),
      },
      {
        id: 'research-collaboration',
        title: 'Collaboration & Partnerships',
        registerLabel: 'Collaboration & Partnership Services',
        items: rows({ ...offline(), planned: true }, [
          [160, 'Partner institution onboarding portal'],
          [161, 'Visiting researcher applications'],
          [162, 'Digital NDA and data-sharing agreement processing'],
          [163, 'Joint project document management'],
        ]),
      },
      {
        id: 'research-impact',
        title: 'Monitoring, Evaluation & Impact',
        registerLabel: 'Monitoring, Evaluation & Impact Tracking',
        items: rows({ ...offline(), planned: true }, [[164, 'Beneficiary and stakeholder feedback']]),
      },
      {
        id: 'research-community',
        title: 'Community & Stakeholder Engagement',
        registerLabel: 'Community & Stakeholder Engagement',
        image: '/images/kmfri/mangrove-planting.webp',
        items: rows({ ...offline(), planned: true }, [
          [165, 'Research findings dissemination portal'],
          [166, 'Citizen science data submission'],
          [167, 'Public dashboards for non-sensitive results'],
        ]),
      },
    ],
  },
  {
    id: 'customer',
    title: 'Payments & Customer Care',
    registerLabel: 'FINANCE',
    tagline: 'Pay securely, get your receipt, and be heard.',
    summary: 'Electronic payments and receipting, complaints and access to information.',
    highlight:
      'Pay for KMFRI services electronically and receive official receipts. If something goes wrong, KMFRI acknowledges and resolves complaints, and proactively publishes public information.',
    benefits: [
      'Electronic payments with official receipts',
      'Complaints acknowledged and resolved',
      'Proactive disclosure of public information',
    ],
    image: '/images/kmfri/hq-gate.webp',
    gallery: [{ src: '/images/kmfri/hq-gate.webp', alt: 'Entrance to KMFRI headquarters, Mombasa' }],
    children: [
      {
        id: 'payments',
        title: 'Payments & Receipting',
        items: rows({ digitized: true, onboarded: false, priority: 'High', progress: 50 }, [
          [141, 'Electronic payments'],
          [140, 'Revenue receipting'],
        ]),
      },
      {
        id: 'customer-care',
        title: 'Complaints & Public Information',
        items: rows(offline(), [
          [142, 'Acknowledgement of public complaints and grievances', null, { note: 'A priority in service delivery.' }],
          [144, 'Resolution of public complaints and grievances', null, { note: 'A priority in service delivery.' }],
          [143, 'Access to public information', null, { note: 'Proactive disclosure of public information.' }],
        ]),
      },
    ],
  },
];

/* ------------------------------ Lookups ------------------------------ */

export interface IndexedItem {
  item: CatalogueItem;
  /** Division → … → the group that lists the item */
  path: CatalogueNode[];
}

const walk = (node: CatalogueNode, trail: CatalogueNode[], out: IndexedItem[]) => {
  const path = [...trail, node];
  node.items?.forEach((item) => out.push({ item, path }));
  node.children?.forEach((child) => walk(child, path, out));
};

/** Every catalogue item with its hierarchy path, in display order. */
export const CATALOGUE_INDEX: IndexedItem[] = (() => {
  const out: IndexedItem[] = [];
  SERVICE_CATALOGUE.forEach((d) => walk(d, [], out));
  return out;
})();

/**
 * Web address segment of each node, unique among its siblings:
 * /catalogue/{division}/{group}/{sub-group}. Division slugs are their ids unless listed.
 */
const NODE_SLUGS: Record<string, string> = {
  customer: 'customer-care',
  'lab-apply': 'apply',
  'lab-field': 'field-work',
  'lab-water': 'water',
  'lab-micro': 'microbiology-molecular',
  'lab-biota': 'biota',
  'lab-biota-quality': 'fish-quality',
  'lab-biota-biochemical': 'biochemical',
  'lab-biota-proximate': 'proximate',
  'lab-biota-taxonomy': 'taxonomy',
  'lab-sediment': 'sediment-soil',
  'aqua-fingerlings': 'fingerlings',
  'aqua-broodstock': 'broodstock',
  'aqua-ornamental': 'ornamental-fish',
  'aqua-feeds': 'feeds',
  'maritime-hire': 'vessel-equipment-hire',
  'visits-educational': 'group-visits',
  'visits-museum': 'museum',
  'conference-booking': 'booking',
  'attachment-apply': 'apply',
  'research-tide-tables': 'tide-tables',
  'research-data': 'data-management',
  'research-admin': 'administration',
  'research-collaboration': 'partnerships',
  'research-impact': 'impact',
  'research-community': 'community',
  'customer-care': 'complaints-information',
};

export const slugOf = (node: CatalogueNode) => NODE_SLUGS[node.id] ?? node.id;

const NODE_PATHS = new Map<string, CatalogueNode[]>();
const URL_PATHS = new Map<string, CatalogueNode[]>();
const indexNodes = (node: CatalogueNode, trail: CatalogueNode[]) => {
  const path = [...trail, node];
  NODE_PATHS.set(node.id, path);
  URL_PATHS.set(path.map(slugOf).join('/'), path);
  node.children?.forEach((c) => indexNodes(c, path));
};
SERVICE_CATALOGUE.forEach((d) => indexNodes(d, []));

/** Division → … → node, or [] for an unknown id. */
export const findCataloguePath = (id?: string): CatalogueNode[] => (id && NODE_PATHS.get(id)) || [];

/** "laboratory/biota/proximate" → node id, or undefined. */
export const nodeIdFromSlugs = (slugs: string) => URL_PATHS.get(slugs.replace(/^\/+|\/+$/g, ''))?.at(-1)?.id;

/** Web address of a catalogue node (or the catalogue itself): /catalogue/laboratory/biota/proximate */
export const catalogueHref = (id?: string) => {
  const path = findCataloguePath(id);
  return path.length ? `/catalogue/${path.map(slugOf).join('/')}` : '/catalogue';
};

/** The division that presents a service portfolio. */
export const divisionForService = (slug?: string) => SERVICE_CATALOGUE.find((d) => d.serviceSlug === slug);

/** All items at or below a node. */
export const itemsUnder = (node: CatalogueNode): CatalogueItem[] => [
  ...(node.items ?? []),
  ...(node.children ?? []).flatMap(itemsUnder),
];

export const CATALOGUE_TOTAL = CATALOGUE_INDEX.length;

export const lowestFee = (node: CatalogueNode): number | undefined => {
  const fees = itemsUnder(node).map((i) => i.feeKES).filter((f): f is number => f != null);
  return fees.length ? Math.min(...fees) : undefined;
};

export const onlineCount = (node: CatalogueNode) => itemsUnder(node).filter((i) => i.onboarded).length;

export const formatKES = (amount: number) => `Ksh ${amount.toLocaleString('en-KE')}`;

export const formatFee = (item: CatalogueItem) =>
  item.feeKES != null ? `${formatKES(item.feeKES)} ${item.feeUnit ?? 'per test'}` : item.feeNote ?? 'On quotation';

/** Popular, ready-to-buy services featured on the home page (register row numbers). */
export const FEATURED_ITEMS = [45, 64, 101, 137]
  .map((no) => CATALOGUE_INDEX.find((x) => x.item.no === no)!)
  .filter(Boolean);

/** "1 service" / "73 services" */
export const servicesLabel = (n: number) => `${n} ${n === 1 ? 'service' : 'services'}`;
