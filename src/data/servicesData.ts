import { ServiceItem } from '../types';

export const KMFRI_SERVICES: ServiceItem[] = [
  {
    id: 'srv-01',
    slug: 'laboratory-analytical-services',
    code: 'KMFRI-LAB-01',
    title: 'Laboratory Analytical Services',
    category: 'analytical',
    categoryLabel: 'Laboratory Analytics',
    description: 'Water analysis, fish analysis, microbiology, chemical analysis, environmental analysis and other specialised laboratory tests.',
    fullOverview: 'KMFRI operates premier accredited marine and freshwater analytical laboratories equipped with state-of-the-art instrumentation including GC-MS, AAS, HPLC, and automated nutrient analyzers. We provide rigorous testing of aquatic chemistry, fish tissue safety, microbiology, effluent compliance, heavy metal toxicology, and ocean acidification parameters to support regulatory compliance, export clearance, and scientific investigations.',
    remarks: 'Government, private sector, researchers, universities, individuals',
    targetClients: [
      'Government agencies & state corporations',
      'Private sector food & fish processing exporters',
      'Water utility & sewerage service providers',
      'Academic researchers & university postgraduates',
      'Commercial mariculture & fish farm operators',
      'Environmental consultants & individuals'
    ],
    keyCapabilities: [
      'Physico-chemical water quality profiling (pH, salinity, DO, turbidity, BOD, COD, TDS)',
      'Heavy metals detection (Mercury, Lead, Cadmium, Arsenic, Copper, Zinc) via AAS',
      'Microbiological assessment (Total Coliforms, E. coli, Vibrio spp., Salmonella) for EU/US export standards',
      'Persistent Organic Pollutants (POPs), pesticide residues & microplastics analysis',
      'Fish tissue proximate analysis (protein, crude fat, moisture, ash content)',
      'Harmful Algal Bloom (HAB) toxins & cyanobacteria screening'
    ],
    sampleRequirements: [
      'Water samples: Minimum 1.5 Litres in pre-cleaned, amber borosilicate glass or sterilized HDPE bottles',
      'Microbiology samples: Minimum 500ml collected in sterile containers, delivered at 4°C within 6 hours',
      'Fish tissue samples: Minimum 250g whole or filleted flesh in sterile ziplock bags, packed on ice (-20°C preferred)',
      'Completed Chain of Custody (CoC) and Sample Submission Form'
    ],
    turnaroundTime: '5 – 7 business days (Express 48h emergency testing available)',
    pricingTiers: [
      { name: 'Standard Potability & Physico-Chemical Water Test', unit: 'per sample', costKES: 4500, costUSD: 35, turnaroundTime: '5 days' },
      { name: 'Full Environmental Compliance Profile (BOD, COD, Heavy Metals)', unit: 'per sample', costKES: 12500, costUSD: 95, turnaroundTime: '7 days' },
      { name: 'Export Fish Tissue Microbiology & Histamine Screening', unit: 'per batch', costKES: 16000, costUSD: 125, turnaroundTime: '4 days' },
      { name: 'Heavy Metal Toxicological Profile (5 metals via AAS)', unit: 'per sample', costKES: 8000, costUSD: 60, turnaroundTime: '5 days' }
    ],
    availableStations: ['Mombasa Headquarters', 'Kisumu Centre', 'Naivasha Centre', 'Shimoni Mariculture Centre'],
    status: 'active',
    featuredImage: '/images/analytical-lab.webp',
    isoStandard: 'ISO/IEC 17025:2017 Accredited',
    contactOfficer: {
      title: 'Chief Principal Research Scientist - Laboratory Analytics',
      email: 'labservices@kmfri.go.ke',
      phone: '+254 (0) 41 475151/4'
    }
  },
  {
    id: 'srv-02',
    slug: 'technical-consultancy-services',
    code: 'KMFRI-CNS-02',
    title: 'Technical Consultancy Services',
    category: 'consultancy',
    categoryLabel: 'Technical Consultancy',
    description: 'Fisheries, aquaculture, marine science, environmental and blue economy consultancy.',
    fullOverview: 'Leveraging over four decades of premier marine research across the Western Indian Ocean and East African Great Lakes, KMFRI provides high-level advisory and technical consultancy. We assist County Governments, national ministries, bilateral development partners, and commercial enterprises with Marine Spatial Planning (MSP), fisheries stock assessments, Environmental Impact Assessments (EIA), and Blue Economy masterplans.',
    remarks: 'Government, counties, private sector, development partners',
    targetClients: [
      'National Government Ministries & Agencies',
      'County Governments (Coastal & Lake Basin regions)',
      'Bilateral & multilateral development partners (World Bank, FAO, UNEP)',
      'Port authorities & maritime infrastructure developers',
      'Commercial maritime operators & offshore renewable developers'
    ],
    keyCapabilities: [
      'Marine Spatial Planning (MSP) & coastal zoning frameworks',
      'Environmental & Social Impact Assessments (ESIA) for port & marine infrastructure',
      'Fisheries stock status evaluation & Total Allowable Catch (TAC) advisory',
      'Blue Carbon accounting (mangrove restoration & seagrass sequestration)',
      'Aquaculture feasibility studies, site selection & cage culture bathymetry',
      'Ballast water management audits & invasive species risk mitigation'
    ],
    sampleRequirements: [
      'Project Terms of Reference (ToR) and project boundaries/geospatial coordinates',
      'Scope of work baseline data and regulatory agency submission deadlines'
    ],
    turnaroundTime: 'Project-dependent (typically 14 – 60 working days per milestone)',
    pricingTiers: [
      { name: 'Preliminary Marine Environmental Appraisal / Site Assessment', unit: 'per site', costKES: 180000, costUSD: 1400, turnaroundTime: '10 days' },
      { name: 'Comprehensive ESIA / Marine Technical Advisory', unit: 'per project milestone', costKES: 650000, costUSD: 5000, turnaroundTime: '30 days' },
      { name: 'County Fisheries & Blue Economy Masterplan Formulation', unit: 'per county blueprint', costKES: 1200000, costUSD: 9200, turnaroundTime: '60 days' }
    ],
    availableStations: ['Mombasa Headquarters', 'Kisumu Centre', 'Naivasha Centre', 'Baringo Station'],
    status: 'active',
    featuredImage: '/images/coral-reef-survey.webp',
    isoStandard: 'ISO 9001:2015 Certified',
    contactOfficer: {
      title: 'Director - Marine & Coastal Research Advisory',
      email: 'consultancy@kmfri.go.ke',
      phone: '+254 20 8021560'
    }
  },
  {
    id: 'srv-03',
    slug: 'fish-and-aquaculture-services',
    code: 'KMFRI-AQU-03',
    title: 'Fish & Aquaculture Services',
    category: 'aquaculture',
    categoryLabel: 'Aquaculture & Seeds',
    description: 'Fingerlings, broodstock, fish feed, Aquariums and related aquaculture services.',
    fullOverview: 'KMFRI is Kenya’s primary scientific authority in sustainable aquaculture development. Our specialized aquaculture hatcheries produce genetically certified, disease-free seed stock (Nile Tilapia, African Catfish, Milkfish, and Marine Crabs), optimized locally-sourced floating fish feeds, live feed cultures (Artemia and Spirulina), and turnkey aquarium design for institutional and private clients.',
    remarks: 'Fish farmers, counties, NGOs, private sector',
    targetClients: [
      'Smallholder & commercial fish farmers',
      'County Government aquaculture stimulus initiatives',
      'Agricultural NGOs & livelihood development projects',
      'Aquaculture feed manufacturers & agro-dealers',
      'Educational institutions, hotels & eco-tourism facilities'
    ],
    keyCapabilities: [
      'Certified high-growth monosex Nile Tilapia (Oreochromis niloticus) fingerlings',
      'African Catfish (Clarias gariepinus) fingerlings & selectively bred broodstock',
      'Marine mariculture seed (Milkfish - Chanos chanos, Mud Crab crablets - Scylla serrata)',
      'High-protein floating feed formulations using local alternative protein sources',
      'Recirculating Aquaculture System (RAS) and cage culture design & installation support',
      'Custom institutional marine and freshwater aquarium setup & maintenance'
    ],
    sampleRequirements: [
      'Seed orders require 14 days advance notification for batch harvest conditioning',
      'Oxygenated transport bags or aerated transport tanks required at collection'
    ],
    turnaroundTime: 'Immediate from nursery stock (or 14 days advance booking for bulk orders > 10,000 units)',
    pricingTiers: [
      { name: 'Certified Monosex Nile Tilapia Fingerlings (Grade A, 5g)', unit: 'per 1,000 pieces', costKES: 7000, costUSD: 55, turnaroundTime: '3 - 7 days' },
      { name: 'African Sharptooth Catfish Fingerlings (Grade A)', unit: 'per 1,000 pieces', costKES: 8500, costUSD: 65, turnaroundTime: '3 - 7 days' },
      { name: 'KMFRI Formulated High-Protein Floating Feed (25kg Bag, 32% CP)', unit: 'per 25kg bag', costKES: 3400, costUSD: 26, turnaroundTime: 'In Stock' },
      { name: 'Mariculture Mud Crab / Milkfish Seed Package', unit: 'per 500 crablets', costKES: 12000, costUSD: 90, turnaroundTime: '10 days' }
    ],
    availableStations: ['Kegati Aquaculture Centre', 'Sangoro Aquaculture Centre', 'Kisumu Centre', 'Shimoni Mariculture Centre', 'Naivasha Centre'],
    status: 'active',
    featuredImage: '/images/aquaculture-hatchery.webp',
    isoStandard: 'KEBS Tested & ISO 9001:2015',
    contactOfficer: {
      title: 'Head of Aquaculture & Seed Multiplication',
      email: 'aquaculture@kmfri.go.ke',
      phone: '+254 722 000000'
    }
  },
  {
    id: 'srv-04',
    slug: 'scientific-data-and-information-services',
    code: 'KMFRI-DAT-04',
    title: 'Scientific Data & Information Services',
    category: 'data',
    categoryLabel: 'Data & Marine Informatics',
    description: 'GIS, marine datasets, fisheries information, scientific reports and specialised data products, Tide tables and other marine information products.',
    fullOverview: 'The National Oceanographic Data Center (KeNODC) hosted at KMFRI curates an exhaustive scientific repository of bathymetric surveys, sea surface temperatures, acoustic fish biomass estimates, tidal harmonics, chlorophyll-a trends, and historical catch-effort statistics for Kenya’s Exclusive Economic Zone (EEZ) and inland lakes.',
    remarks: 'Researchers, consultants, government, universities',
    targetClients: [
      'Academic researchers & university faculties',
      'Environmental & offshore engineering consultants',
      'Shipping, port navigation & marine salvage companies',
      'Government policy makers & regional maritime security bodies',
      'Climate scientists and meteorologists'
    ],
    keyCapabilities: [
      'Official Kenya National Tide Tables (Hourly tidal elevations & lunar cycles)',
      'Bathymetric digital terrain models (DTM) of coastal shelf & Lake Victoria',
      'Long-term sea surface temperature (SST) & ocean current vector datasets',
      'Marine and estuarine GIS shapefiles (mangrove extent, coral reef health, seagrass beds)',
      'Fisheries catch per unit effort (CPUE) statistical records & species distribution models',
      'Satellite remote sensing chlorophyll-a and ocean productivity composites'
    ],
    sampleRequirements: [
      'Data Use Agreement (DUA) form specifying academic, commercial, or governmental purpose',
      'Specific spatial bounding coordinates (Bounding Box) and temporal range required'
    ],
    turnaroundTime: '1 – 3 business days for digital repository extraction',
    pricingTiers: [
      { name: 'Annual Official Kenya Port Tide Tables (Digital / Printed)', unit: 'per annual volume', costKES: 2500, costUSD: 20, turnaroundTime: 'Immediate' },
      { name: 'Standard Spatial GIS Marine Dataset Pack (5km resolution)', unit: 'per theme / region', costKES: 25000, costUSD: 195, turnaroundTime: '2 days' },
      { name: 'Specialized High-Resolution Bathymetry & Acoustic Biomass Data', unit: 'per project survey extract', costKES: 75000, costUSD: 580, turnaroundTime: '3 days' },
      { name: 'Academic Student Research Dataset Voucher (Subsidized)', unit: 'per verified student thesis', costKES: 3500, costUSD: 28, turnaroundTime: '2 days' }
    ],
    availableStations: ['Mombasa Headquarters (KeNODC)', 'Kisumu Centre'],
    status: 'active',
    featuredImage: '/images/vessel-aerial.webp',
    isoStandard: 'IOC/IODE Quality Management Framework',
    contactOfficer: {
      title: 'National Oceanographic Data Coordinator (KeNODC)',
      email: 'datarequest@kmfri.go.ke',
      phone: '+254 (0) 41 475151'
    }
  },
  {
    id: 'srv-05',
    slug: 'research-vessel-hire-services',
    code: 'KMFRI-VES-05',
    title: 'Research Vessel Hire Services',
    category: 'vessel',
    categoryLabel: 'Research Vessel Fleet',
    description: 'Research vessel hire, marine surveys, scientific expeditions and related marine support.',
    fullOverview: 'KMFRI owns and operates flagship research vessels led by RV Mtafiti, a 53-meter state-of-the-art oceanographic vessel fitted with advanced seabed mapping multibeam echosounders, CTD rosettes, meteorological weather stations, wet and dry laboratories, and deep-water acoustic trawling gear. We provide vessel charter for scientific research cruises, environmental baselines, cable route surveys, and offshore marine observation across Kenya’s 200nm EEZ.',
    remarks: 'Government, researchers, universities, private sector',
    targetClients: [
      'International and regional marine research institutes',
      'Offshore telecom cable and pipeline installation contractors',
      'National security, coast guard and maritime regulatory authorities',
      'Universities conducting multidisciplinary oceanographic expeditions',
      'Private marine geophysical and geotechnical survey firms'
    ],
    keyCapabilities: [
      'RV Mtafiti: 53.2m LOA, 1,040 Gross Tonnage, 30-day endurance, accommodates 28 scientists',
      'Kongsberg EM710 Multibeam Echosounder & Simrad EK80 Scientific Echosounders',
      'Sea-Bird SBE 911plus CTD carousel with 24 x 10L Niskin water sampling bottles',
      'Sub-bottom profiler, sidescan sonar and deep-sea benthic grab deployment A-frame',
      'Freshwater research boats: RV Utafiti (Lake Victoria) and aluminum survey catamarans',
      'Certified marine crew, certified navigation officers, and onboard scientific technical support'
    ],
    sampleRequirements: [
      'Cruise Plan & Scientific Expedition Protocol submitted 30 days prior to mobilization',
      'Port clearance, environmental compliance certification, and onboard scientist manifest'
    ],
    turnaroundTime: 'Booking confirmation within 5 working days; mobilization per voyage schedule',
    pricingTiers: [
      { name: 'RV Mtafiti Full Oceanographic Charter (Kenya EEZ, 24h operational day)', unit: 'per day (sea time)', costKES: 850000, costUSD: 6500, turnaroundTime: 'Scheduled cruise' },
      { name: 'RV Mtafiti In-Port / Mobilization & Demobilization Day', unit: 'per day (port standby)', costKES: 350000, costUSD: 2700, turnaroundTime: 'Scheduled' },
      { name: 'Lake Victoria Research Survey Boat (RV Utafiti with skipper)', unit: 'per day (inland lake)', costKES: 95000, costUSD: 730, turnaroundTime: '2 days advance' },
      { name: 'Coastal Inshore Rigid-Inflatable Survey Boat (RIB)', unit: 'per day', costKES: 45000, costUSD: 350, turnaroundTime: '1 day advance' }
    ],
    availableStations: ['Mombasa Headquarters (Kilindini Pier)', 'Kisumu Centre (Lake Victoria Pier)'],
    status: 'active',
    featuredImage: '/images/vessel-port.webp',
    isoStandard: 'IMO ISM Compliant & ISO 9001:2015',
    contactOfficer: {
      title: 'Chief Vessel Operations Superintendent',
      email: 'vesselops@kmfri.go.ke',
      phone: '+254 711 999888'
    }
  },
  {
    id: 'srv-06',
    slug: 'fish-products-and-value-addition-services',
    code: 'KMFRI-VAL-06',
    title: 'Fish Products & Value-Addition Services',
    category: 'value_addition',
    categoryLabel: 'Post-Harvest & Value Addition',
    description: 'Product development and post-harvest technology support.',
    fullOverview: 'Post-harvest losses in Kenya’s fisheries historically reach 20–30%. KMFRI’s Post-Harvest Fish Technology and Value-Addition Incubation Hub provides technical know-how, product formulation, cold chain protocols, smoking/drying innovations, and quality assurance for fish processors, artisanal fisher cooperatives, and agri-business enterprises looking to enter high-value domestic and export markets.',
    remarks: 'Fish processors, SMEs, cooperatives',
    targetClients: [
      'Beach Management Units (BMUs) and Fisher Cooperatives',
      'Commercial fish processing factories and retail distributors',
      'Agro-processing women & youth self-help groups and SMEs',
      'Supermarket fresh-fish procurement managers',
      'Animal feed millers utilizing fish processing by-products'
    ],
    keyCapabilities: [
      'Solar-biomass hybrid fish drying kilns & modern hygienic smoking ovens',
      'Fish value-added product development (fish sausages, fish fillets, samosas, fish patties, fish meal)',
      'Fish silage and organic bio-fertilizer technology using visceral processing waste',
      'Modified Atmosphere Packaging (MAP) & vacuum packaging shelf-life optimization',
      'HACCP system design, traceability auditing, and sanitary standard operating procedures (SSOP)'
    ],
    sampleRequirements: [
      'Client raw material samples (minimum 10kg) with recorded post-harvest handling history',
      'Proposed recipe or target market technical specification'
    ],
    turnaroundTime: 'Product formulation trials: 7 – 14 business days',
    pricingTiers: [
      { name: 'Fish Value-Addition Processing Incubation (Technical Protocol & Recipe Formulation)', unit: 'per product line', costKES: 45000, costUSD: 350, turnaroundTime: '10 days' },
      { name: 'Hygienic Fish Smoking / Drying Kiln Construction Blueprint & Advisory', unit: 'per design package', costKES: 30000, costUSD: 230, turnaroundTime: '7 days' },
      { name: 'HACCP & Post-Harvest Quality Audit for Cooperative / SME Processing Facility', unit: 'per facility audit', costKES: 60000, costUSD: 460, turnaroundTime: '5 days' }
    ],
    availableStations: ['Kisumu Centre (Fish Processing Lab)', 'Mombasa Headquarters', 'Naivasha Centre', 'Baringo Station'],
    status: 'active',
    featuredImage: '/images/aquaculture-hatchery.webp',
    isoStandard: 'KEBS Standards & ISO 9001:2015',
    contactOfficer: {
      title: 'Principal Post-Harvest Fish Technologist',
      email: 'postharvest@kmfri.go.ke',
      phone: '+254 20 8021562'
    }
  },
  {
    id: 'srv-07',
    slug: 'educational-visits',
    code: 'KMFRI-EDU-07',
    title: 'Educational Visits & Marine Tours',
    category: 'education',
    categoryLabel: 'Educational Tours & Museum',
    description: 'Museum visits and educational tours.',
    fullOverview: 'KMFRI opens its scientific laboratories, marine public aquariums, fish biology museum galleries, and research vessels to curious minds. Our guided educational tours offer students, scholars, international delegates, and the general public a front-row immersion into marine biodiversity, ocean science, fish anatomy, mangrove conservation, and blue economy careers.',
    remarks: 'Schools, universities, tourists, general public',
    targetClients: [
      'Primary, secondary and international schools',
      'Tertiary colleges, polytechnics, and university departments',
      'Local & international ecotourists and families',
      'Civic and community environmental conservation clubs',
      'Corporate CSR teams & professional science delegations'
    ],
    keyCapabilities: [
      'Curated tours of the KMFRI Marine Biology Museum and fish specimen archives',
      'Live Marine and Freshwater Public Aquariums showcasing indigenous species',
      'Interactive ocean literacy workshops led by practicing marine scientists',
      'Guided walk through mangrove restoration nurseries and mariculture ponds',
      'Observation deck access to view research vessel operations at Mombasa Kilindini pier'
    ],
    sampleRequirements: [
      'Advance reservation request submitted at least 48 hours prior to proposed visit date',
      'Official school or institution delegation letter indicating total participant numbers'
    ],
    turnaroundTime: 'Immediate booking confirmation upon availability',
    pricingTiers: [
      { name: 'Primary & Secondary School Students (Per Student)', unit: 'per student', costKES: 100, costUSD: 1, turnaroundTime: 'Instant' },
      { name: 'College & University Students (Per Student with Student ID)', unit: 'per student', costKES: 200, costUSD: 2, turnaroundTime: 'Instant' },
      { name: 'Kenyan Adult Citizens & Residents', unit: 'per adult', costKES: 300, costUSD: 3, turnaroundTime: 'Instant' },
      { name: 'Non-Resident International Tourists', unit: 'per visitor', costKES: 1000, costUSD: 10, turnaroundTime: 'Instant' }
    ],
    availableStations: ['Mombasa Headquarters (Marine Museum)', 'Kisumu Centre (Freshwater Aquarium)', 'Naivasha Centre', 'Shimoni Mariculture Centre'],
    status: 'active',
    featuredImage: '/images/coral-reef-survey.webp',
    isoStandard: 'Public Service Customer Care Charter',
    contactOfficer: {
      title: 'Corporate Communications & Public Relations Officer',
      email: 'visits@kmfri.go.ke',
      phone: '+254 20 8021560 Ext 104'
    }
  },
  {
    id: 'srv-08',
    slug: 'training-and-capacity-building',
    code: 'KMFRI-TRN-08',
    title: 'Training & Capacity Building',
    category: 'training',
    categoryLabel: 'Professional Training',
    description: 'Technical training, fisheries, aquaculture, laboratory and marine science courses.',
    fullOverview: 'Designed to elevate professional competency across the maritime and fisheries sectors, KMFRI’s upcoming Technical Training Institute delivers certified executive and practitioner short courses. Curriculum modules span modern aquaculture management, microbiological laboratory techniques, GIS for marine conservation, and blue carbon project verification.',
    remarks: 'Coming Soon',
    targetClients: [
      'County Fisheries Officers & agricultural extension workers',
      'Commercial fish farm managers & hatchery supervisors',
      'Laboratory technicians in water & food testing facilities',
      'Marine conservation practitioners & NGO project managers',
      'Private sector maritime environmental compliance officers'
    ],
    keyCapabilities: [
      'Certificate in Commercial Tilapia & Catfish Hatchery Management (5-day intensive)',
      'Practical Marine & Freshwater Laboratory Analytical Techniques (ISO 17025 compliance)',
      'Marine Spatial Planning (MSP) & QGIS for coastal resource management',
      'Blue Economy Entrepreneurship & Value Chain Financial Modeling',
      'Benthic Habitat Surveying, SCUBA scientific diving & coral reef monitoring'
    ],
    sampleRequirements: [
      'Registration form and copy of relevant academic or vocational background'
    ],
    turnaroundTime: 'Enrolling cohort calendar launching Q3 2026 (Pre-registration now open)',
    pricingTiers: [
      { name: '5-Day Intensive Hatchery & Aquaculture Management Masterclass', unit: 'per participant', costKES: 35000, costUSD: 270, turnaroundTime: 'Cohort intake' },
      { name: '3-Day Water Quality & Lab Analytical Testing Workshop', unit: 'per participant', costKES: 25000, costUSD: 190, turnaroundTime: 'Cohort intake' },
      { name: 'Executive Marine Spatial Planning (MSP) & GIS Masterclass', unit: 'per participant', costKES: 45000, costUSD: 350, turnaroundTime: 'Cohort intake' }
    ],
    availableStations: ['Mombasa Headquarters', 'Kisumu Centre', 'Naivasha Centre'],
    status: 'coming_soon',
    featuredImage: '/images/analytical-lab.webp',
    isoStandard: 'TVETA Accredited Curriculum (In Process)',
    contactOfficer: {
      title: 'Head of Capacity Development & Training',
      email: 'training@kmfri.go.ke',
      phone: '+254 20 8021561'
    }
  },
  {
    id: 'srv-09',
    slug: 'conference-and-meeting-facilities',
    code: 'KMFRI-CNF-09',
    title: 'Conference & Meeting Facilities',
    category: 'facilities',
    categoryLabel: 'Conference Facilities',
    description: 'Conference halls, meeting rooms and associated facilities.',
    fullOverview: 'Set in tranquil scientific campuses overlooking picturesque coastal bays and lakesides, KMFRI offers modern conference halls, executive boardrooms, and outdoor botanical grounds. Ideal for government retreats, international symposiums, stakeholder workshops, and corporate seminars, our facilities are equipped with high-speed fiber internet, audio-visual systems, and dedicated catering services.',
    remarks: 'Government, NGOs, private sector, researchers',
    targetClients: [
      'National & County Government departments and taskforces',
      'Non-Governmental Organizations (NGOs) & development agencies',
      'Corporate institutions seeking serene offsite meeting spaces',
      'Academic and scientific research consortiums',
      'Community Beach Management Unit (BMU) stakeholder assemblies'
    ],
    keyCapabilities: [
      'Main Conference Auditorium (Capacity: 250 seated, fully air-conditioned, 4K projection)',
      'Executive Boardroom (Capacity: 30 pax, motorized video conferencing system & high-speed Wi-Fi)',
      'Breakout Committee Seminar Rooms (Capacity: 15–40 pax per room)',
      'Scenic Oceanfront & Lakefront Botanical Grounds for exhibitions and banquets',
      'Onsite catering services offering authentic Kenyan coastal & lake cuisine',
      'Dedicated backup generators, secure perimeter parking, and 24/7 security'
    ],
    sampleRequirements: [
      'Facility reservation form indicating event agenda, dates, and setup requirements',
      'Booking secured upon 50% commitment deposit'
    ],
    turnaroundTime: 'Instant availability check; reservation confirmed within 24 hours',
    pricingTiers: [
      { name: 'Full-Day Main Auditorium Hire (Up to 250 Pax, with AV & PA system)', unit: 'per day', costKES: 50000, costUSD: 390, turnaroundTime: 'Immediate' },
      { name: 'Half-Day Main Auditorium Hire', unit: 'per half-day', costKES: 30000, costUSD: 230, turnaroundTime: 'Immediate' },
      { name: 'Executive Boardroom Hire with Video Conferencing (Up to 30 Pax)', unit: 'per day', costKES: 25000, costUSD: 195, turnaroundTime: 'Immediate' },
      { name: 'Scenic Ocean / Lakeside Grounds Hire (Banquets / Exhibitions)', unit: 'per event day', costKES: 60000, costUSD: 460, turnaroundTime: 'Immediate' }
    ],
    availableStations: ['Mombasa Headquarters (English Point Overlook)', 'Kisumu Centre (Lake Victoria Shoreline)', 'Naivasha Centre'],
    status: 'active',
    featuredImage: '/images/vessel-aerial.webp',
    isoStandard: 'ISO 9001:2015 Hospitality Service Standards',
    contactOfficer: {
      title: 'Facilities & Logistics Administrator',
      email: 'facilities@kmfri.go.ke',
      phone: '+254 (0) 41 475151 Ext 220'
    }
  },
  {
    id: 'srv-10',
    slug: 'student-attachment-and-internship-services',
    code: 'KMFRI-ATT-10',
    title: 'Student Attachment & Internship Services',
    category: 'internship',
    categoryLabel: 'Internships & Attachments',
    description: 'Industrial attachment, internship and practical research placements.',
    fullOverview: 'In alignment with the Public Service Commission (PSC) guidelines and our institutional mandate to mentor next-generation scientists, KMFRI offers structured 3-month industrial attachments and 1-year graduate internships. Placements are offered in Marine Biology, Limnology, Aquaculture, Chemical Oceanography, Marine Geology, GIS & Remote Sensing, Information Technology, and Procurement.',
    remarks: 'Students and institutions',
    targetClients: [
      'Undergraduate and diploma students in biological, physical & environmental sciences',
      'Recent Kenyan university graduates seeking PSC-aligned internship experience',
      'Universities seeking recognized research placement partnerships',
      'International postgraduate exchange fellows'
    ],
    keyCapabilities: [
      'Direct mentorship by licensed Research Scientists and Laboratory Analysts',
      'Hands-on field sampling on coastal creeks, reefs, open ocean, and freshwater lakes',
      'Access to KMFRI specialized research libraries, data repositories, and equipment',
      'Certificate of Industrial Attachment Completion upon successful defense of project report',
      'Formal evaluation report issued directly to candidate university dean'
    ],
    sampleRequirements: [
      'Official introductory letter from registered University or College Dean',
      'Curriculum Vitae (CV) & National Identity Card / Passport copy',
      'Valid student personal accident insurance cover certificate',
      'Police Clearance Certificate (for 1-year graduate internships)'
    ],
    turnaroundTime: 'Application review within 10 working days of cohort intake deadline',
    pricingTiers: [
      { name: 'Standard 3-Month Undergraduate Industrial Attachment (Institutional Admin Fee)', unit: 'per 3-month term', costKES: 3000, costUSD: 25, turnaroundTime: 'Quarterly intake' },
      { name: 'Postgraduate Practical Research Bench Placement (Laboratory Access Included)', unit: 'per month', costKES: 5000, costUSD: 40, turnaroundTime: 'Per semester' },
      { name: 'International Visiting Student / Fellow Research Attachment', unit: 'per month', costKES: 15000, costUSD: 120, turnaroundTime: 'On application' }
    ],
    availableStations: ['All KMFRI Centres & Research Stations Nationwide'],
    status: 'active',
    featuredImage: '/images/analytical-lab.webp',
    isoStandard: 'Public Service Commission (PSC) Internship Policy',
    contactOfficer: {
      title: 'Human Resource Development & Student Attachment Coordinator',
      email: 'attachments@kmfri.go.ke',
      phone: '+254 20 8021560 Ext 112'
    }
  }
];
