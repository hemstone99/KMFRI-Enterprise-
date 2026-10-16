-- ====================================================================
-- KENYA MARINE AND FISHERIES RESEARCH INSTITUTE (KMFRI)
-- Commercial & Enterprise Services Sub-Website Database
-- Database: kmfri_services_db
-- Compatibility: MySQL 8.0+ / MariaDB 10.5+ / AWS RDS / GCP Cloud SQL
-- Charset: utf8mb4 | Collation: utf8mb4_unicode_ci | Engine: InnoDB
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET time_zone = '+03:00'; -- East Africa Time (EAT)

-- --------------------------------------------------------------------
-- 1. DATABASE INITIALIZATION
-- --------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS kmfri_services_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kmfri_services_db;

-- --------------------------------------------------------------------
-- 2. TABLE DEFINITIONS
-- --------------------------------------------------------------------

-- Table 1: Service Categories
DROP TABLE IF EXISTS service_categories;
CREATE TABLE service_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  icon VARCHAR(50) DEFAULT 'flask',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_order (display_order)
) ENGINE=InnoDB COMMENT='10 Core Service Clusters as approved in KMFRI Enterprise Blueprint';

-- Table 2: Research Stations & Mariculture Centres
DROP TABLE IF EXISTS research_stations;
CREATE TABLE research_stations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  station_type ENUM('headquarters', 'freshwater_centre', 'mariculture_station', 'aquaculture_station', 'sub_station') DEFAULT 'sub_station',
  location VARCHAR(200) NOT NULL,
  county VARCHAR(100) NOT NULL,
  head_of_station VARCHAR(150) NOT NULL,
  head_title VARCHAR(100) DEFAULT 'Centre Director',
  contact_email VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  physical_address TEXT NULL,
  postal_address VARCHAR(150) DEFAULT 'P.O. Box 81651 - 80100, Mombasa, Kenya',
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  operational_status ENUM('active', 'under_expansion', 'seasonal') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_county (county)
) ENGINE=InnoDB COMMENT='Nationwide KMFRI scientific centres, inland lake stations & coastal mariculture hubs';

-- Table 3: Station Specialized Facilities
DROP TABLE IF EXISTS station_facilities;
CREATE TABLE station_facilities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  station_id INT UNSIGNED NOT NULL,
  facility_name VARCHAR(150) NOT NULL,
  facility_type ENUM('laboratory', 'hatchery', 'vessel_berth', 'data_centre', 'auditorium', 'incubation_hub') NOT NULL,
  accreditation_details VARCHAR(150) NULL,
  capacity_description VARCHAR(200) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES research_stations(id) ON DELETE CASCADE,
  INDEX idx_station (station_id)
) ENGINE=InnoDB COMMENT='Accredited physical infrastructure and specialized laboratories per station';

-- Table 4: Research Vessels & Marine Crafts
DROP TABLE IF EXISTS research_vessels;
CREATE TABLE research_vessels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vessel_name VARCHAR(100) NOT NULL,
  home_port VARCHAR(100) NOT NULL DEFAULT 'Port of Kilindini, Mombasa',
  length_metres DECIMAL(6, 2) NOT NULL,
  beam_metres DECIMAL(6, 2) NOT NULL,
  draft_metres DECIMAL(6, 2) NOT NULL,
  gross_tonnage INT UNSIGNED NOT NULL,
  max_speed_knots DECIMAL(5, 2) NOT NULL,
  cruise_speed_knots DECIMAL(5, 2) NOT NULL,
  endurance_days INT UNSIGNED NOT NULL,
  scientist_berths INT UNSIGNED NOT NULL,
  crew_berths INT UNSIGNED NOT NULL,
  primary_scientific_gear TEXT NOT NULL,
  charter_rate_kes_per_day DECIMAL(12, 2) NOT NULL,
  charter_rate_usd_per_day DECIMAL(10, 2) NOT NULL,
  status ENUM('available', 'on_expedition', 'maintenance') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Oceanographic research vessels (RV Mtafiti) and survey crafts available for hire';

-- Table 5: Core Enterprise Services
DROP TABLE IF EXISTS services;
CREATE TABLE services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  full_overview LONGTEXT NOT NULL,
  remarks VARCHAR(255) NOT NULL COMMENT 'Target clientele categories defined in official catalogue',
  turnaround_time VARCHAR(100) NOT NULL,
  iso_standard VARCHAR(150) DEFAULT 'ISO 9001:2015 Certified',
  contact_officer_title VARCHAR(150) NOT NULL,
  contact_email VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  featured_image VARCHAR(255) NULL,
  status ENUM('active', 'coming_soon', 'pilot') DEFAULT 'active',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE RESTRICT,
  INDEX idx_code (code),
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  FULLTEXT KEY ft_search (title, short_description, full_overview)
) ENGINE=InnoDB COMMENT='Main catalogue of 10 KMFRI commercialized scientific services';

-- Table 6: Service Tariffs & Pricing Tiers
DROP TABLE IF EXISTS pricing_tiers;
CREATE TABLE pricing_tiers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id INT UNSIGNED NOT NULL,
  tier_name VARCHAR(200) NOT NULL,
  unit_description VARCHAR(100) NOT NULL COMMENT 'e.g. per sample, per 1000 fingerlings, per day, per dataset',
  cost_kes DECIMAL(12, 2) NOT NULL,
  cost_usd DECIMAL(10, 2) NULL,
  turnaround_time VARCHAR(100) NOT NULL,
  vat_applicable TINYINT(1) DEFAULT 0 COMMENT '0 = Statutory Exempt, 1 = 16% Standard VAT',
  is_active TINYINT(1) DEFAULT 1,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service (service_id)
) ENGINE=InnoDB COMMENT='Approved public fee schedule in Kenya Shillings (KES) and USD';

-- Table 7: Service Submission Protocols & Requirements
DROP TABLE IF EXISTS service_requirements;
CREATE TABLE service_requirements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id INT UNSIGNED NOT NULL,
  requirement_title VARCHAR(150) NOT NULL,
  requirement_text TEXT NOT NULL,
  is_mandatory TINYINT(1) DEFAULT 1,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service (service_id)
) ENGINE=InnoDB COMMENT='Client sample preservation, minimum quantities, vessel permits, booking criteria';

-- Table 8: Service Technical Capabilities & Equipment
DROP TABLE IF EXISTS service_capabilities;
CREATE TABLE service_capabilities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id INT UNSIGNED NOT NULL,
  capability_title VARCHAR(255) NOT NULL,
  equipment_used VARCHAR(200) NULL,
  detection_limit VARCHAR(100) NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service (service_id)
) ENGINE=InnoDB COMMENT='Specialized technical capacities, instrumentation (GC-MS, AAS, HPLC, CTD) & scopes';

-- Table 9: Service-to-Station Mapping (Many-to-Many)
DROP TABLE IF EXISTS service_stations_map;
CREATE TABLE service_stations_map (
  service_id INT UNSIGNED NOT NULL,
  station_id INT UNSIGNED NOT NULL,
  is_lead_centre TINYINT(1) DEFAULT 0,
  PRIMARY KEY (service_id, station_id),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES research_stations(id) ON DELETE CASCADE,
  INDEX idx_station (station_id)
) ENGINE=InnoDB COMMENT='Identifies which nationwide centres offer each specific service';

-- Table 10: Scientific Marine Datasets Catalog (KeNODC)
DROP TABLE IF EXISTS scientific_datasets;
CREATE TABLE scientific_datasets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dataset_title VARCHAR(200) NOT NULL,
  dataset_code VARCHAR(50) NOT NULL UNIQUE,
  coverage_area VARCHAR(150) NOT NULL COMMENT 'e.g. Kenya Exclusive Economic Zone (EEZ), Lake Victoria, Lamu Archipelago',
  spatial_resolution VARCHAR(100) NOT NULL,
  temporal_range VARCHAR(100) NOT NULL,
  data_format VARCHAR(50) NOT NULL COMMENT 'e.g. NetCDF, GeoTIFF, CSV, Shapefile',
  tariff_kes DECIMAL(10, 2) NOT NULL,
  academic_concession_kes DECIMAL(10, 2) NOT NULL,
  curating_centre VARCHAR(100) DEFAULT 'KeNODC - Mombasa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='National Oceanographic Data Center curated scientific products';

-- Table 11: Citizen & Enterprise Service Delivery Charter
DROP TABLE IF EXISTS service_charter;
CREATE TABLE service_charter (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id INT UNSIGNED NOT NULL,
  service_name VARCHAR(200) NOT NULL,
  statutory_turnaround_time VARCHAR(100) NOT NULL,
  official_fee_summary VARCHAR(150) NOT NULL,
  responsible_officer VARCHAR(150) NOT NULL,
  redress_channel VARCHAR(200) DEFAULT 'director@kmfri.go.ke / Commission on Administrative Justice (Ombudsman)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Public Service Commission of Kenya mandated service delivery commitments';

-- Table 12: Customer Inquiries & Quotation Requests
DROP TABLE IF EXISTS service_inquiries;
CREATE TABLE service_inquiries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(50) NOT NULL UNIQUE,
  service_id INT UNSIGNED NOT NULL,
  pricing_tier_id INT UNSIGNED NULL,
  preferred_station_id INT UNSIGNED NULL,
  client_type ENUM('government', 'county', 'private', 'researcher', 'university', 'sme', 'individual') NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  organization VARCHAR(200) NOT NULL,
  kra_pin VARCHAR(20) NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  estimated_quantity INT UNSIGNED DEFAULT 1,
  estimated_cost_kes DECIMAL(12, 2) DEFAULT 0.00,
  client_notes TEXT NULL,
  status ENUM('pending', 'under_review', 'quote_issued', 'invoice_generated', 'paid', 'fulfilled', 'cancelled') DEFAULT 'pending',
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  FOREIGN KEY (pricing_tier_id) REFERENCES pricing_tiers(id) ON DELETE SET NULL,
  FOREIGN KEY (preferred_station_id) REFERENCES research_stations(id) ON DELETE SET NULL,
  INDEX idx_ref (reference_number),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB COMMENT='Official client quote requests and sample submission pre-registrations';

-- Table 13: Inquiry Status Audit History
DROP TABLE IF EXISTS inquiry_status_history;
CREATE TABLE inquiry_status_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inquiry_id INT UNSIGNED NOT NULL,
  previous_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(100) NOT NULL DEFAULT 'System Workflow',
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inquiry_id) REFERENCES service_inquiries(id) ON DELETE CASCADE,
  INDEX idx_inquiry (inquiry_id)
) ENGINE=InnoDB COMMENT='Full audit trail of inquiry status transitions for governance compliance';

-- Table 14: Client Customer Satisfaction Feedback
DROP TABLE IF EXISTS client_feedback;
CREATE TABLE client_feedback (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inquiry_id INT UNSIGNED NULL,
  service_id INT UNSIGNED NOT NULL,
  client_name VARCHAR(150) NOT NULL,
  organization VARCHAR(200) NOT NULL,
  rating_score TINYINT UNSIGNED NOT NULL COMMENT 'Score 1 to 5 stars',
  turnaround_adherence ENUM('ahead_of_time', 'on_time', 'delayed') DEFAULT 'on_time',
  scientific_accuracy_rating ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'excellent',
  customer_comments TEXT NULL,
  testimonial_approved TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inquiry_id) REFERENCES service_inquiries(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Quality assurance feedback loops for ISO 9001:2015 continuous improvement';


-- --------------------------------------------------------------------
-- 3. SEED DATA (All 10 Proposed Commercial Services from PDF Catalogue)
-- --------------------------------------------------------------------

-- Seed Service Categories
INSERT INTO service_categories (id, name, slug, description, icon, display_order) VALUES
(1, 'Analytical Laboratories', 'analytical-laboratories', 'Accredited physical, chemical, microbiological, heavy metals and environmental testing', 'microscope', 1),
(2, 'Advisory & Consultancy', 'advisory-consultancy', 'Specialized marine spatial planning, ESIA, fisheries stock assessment and blue economy advisory', 'briefcase', 2),
(3, 'Aquaculture & Seed Production', 'aquaculture-seed', 'Certified monosex fingerlings, broodstock, high-protein formulated feed and technical hatchery support', 'fish', 3),
(4, 'Marine Data & Informatics', 'marine-data', 'Oceanographic datasets, GIS maps, tide tables, bathymetry surveys and scientific publications', 'database', 4),
(5, 'Research Vessels & Marine Hire', 'vessel-hire', 'Offshore oceanographic research vessels (RV Mtafiti) and inland lake survey crafts', 'ship', 5),
(6, 'Post-Harvest & Value Addition', 'value-addition', 'Fish processing incubation, modern smoking/drying kilns, cold chain and HACCP standards', 'package', 6),
(7, 'Education & Scientific Tours', 'education-tours', 'Marine museums, public aquariums, student field excursions and guided coastal tours', 'users', 7),
(8, 'Professional Training', 'professional-training', 'Certified technical courses in fisheries management, aquaculture breeding and laboratory science', 'award', 8),
(9, 'Conference & Hospitality', 'conference-facilities', 'Oceanfront and lakeside conference halls, executive boardrooms and event grounds', 'building', 9),
(10, 'Student Placements', 'student-attachments', 'Industrial attachments and practical scientific research internships for colleges & universities', 'graduation-cap', 10);

-- Seed Research Stations
INSERT INTO research_stations (id, name, code, station_type, location, county, head_of_station, head_title, contact_email, contact_phone, latitude, longitude) VALUES
(1, 'Mombasa Headquarters & Marine Centre', 'KMFRI-MBA', 'headquarters', 'English Point, Mkomani, Mombasa', 'Mombasa', 'Prof. James Njiru, PhD', 'Director General & CEO', 'director@kmfri.go.ke', '+254 (0) 41 475151', -4.0531000, 39.6806000),
(2, 'Kisumu Centre (Freshwater Systems)', 'KMFRI-KSM', 'freshwater_centre', 'Off Airport Road, Kisumu', 'Kisumu', 'Dr. Christopher Aura, PhD', 'Centre Director', 'kisumu@kmfri.go.ke', '+254 (0) 57 2021461', -0.1022000, 34.7617000),
(3, 'Naivasha Centre (Rift Valley Lakes)', 'KMFRI-NVS', 'freshwater_centre', 'South Lake Road, Naivasha', 'Nakuru', 'Dr. Edna Waithaka', 'Centre Director', 'naivasha@kmfri.go.ke', '+254 (0) 50 2020277', -0.7172000, 36.4310000),
(4, 'Shimoni Mariculture Centre', 'KMFRI-SHM', 'mariculture_station', 'Shimoni Peninsula, Wasini Channel', 'Kwale', 'Dr. David Mirera, PhD', 'Senior Mariculture Scientist', 'shimoni@kmfri.go.ke', '+254 (0) 722 123456', -4.6478000, 39.3822000),
(5, 'Kegati Aquaculture Centre', 'KMFRI-KGT', 'aquaculture_station', 'Kegati, Kisii', 'Kisii', 'Dr. Paul Orina, PhD', 'Aquaculture Specialist', 'kegati@kmfri.go.ke', '+254 (0) 58 3012300', -0.6817000, 34.7891000),
(6, 'Sangoro Aquaculture Research Station', 'KMFRI-SNG', 'aquaculture_station', 'Pap-Onditi, Nyakach', 'Kisumu', 'Dr. Kevin Obiero, PhD', 'Senior Research Scientist', 'sangoro@kmfri.go.ke', '+254 (0) 57 2023900', -0.3475000, 34.9312000),
(7, 'Baringo Station (ASAL Lakes)', 'KMFRI-BRG', 'sub_station', 'Kampi ya Samaki, Lake Baringo', 'Baringo', 'Cyrus Kilonzi', 'Station Coordinator', 'baringo@kmfri.go.ke', '+254 (0) 53 2031122', 0.6225000, 36.0125000),
(8, 'Turkana Station (Desert Lake)', 'KMFRI-TRK', 'sub_station', 'Kalokol, Lake Turkana', 'Turkana', 'James Last Keyombe', 'Station Coordinator', 'turkana@kmfri.go.ke', '+254 (0) 54 2123300', 3.5292000, 35.8450000);

-- Seed Station Facilities
INSERT INTO station_facilities (station_id, facility_name, facility_type, accreditation_details, capacity_description) VALUES
(1, 'Central Marine Chemical & Environmental Lab', 'laboratory', 'ISO/IEC 17025:2017 Accredited', 'High-throughput AAS, HPLC, GC-MS analytical suites'),
(1, 'National Oceanographic Data Center (KeNODC)', 'data_centre', 'IOC/IODE Accredited National Data Repository', 'Tier-2 server room with fiber backbone & GIS workstations'),
(1, 'RV Mtafiti Dedicated Marine Berth', 'vessel_berth', 'ISPS Code Compliant Deepwater Berth', '53m vessel mooring pier with crane shore power'),
(1, 'Mombasa Marine Science Auditorium', 'auditorium', 'Hospitality Standard ISO 9001', '250 seating capacity with state-of-the-art AV'),
(2, 'Freshwater Fisheries & Limnology Laboratories', 'laboratory', 'ISO/IEC 17025:2017 Accredited', 'Lake Victoria water quality & fish disease testing'),
(2, 'Lake Victoria Fish Incubation & Processing Hub', 'incubation_hub', 'KEBS Standard Compliant', 'Eco-dryers, solar kilns and modern vacuum packers'),
(3, 'Rift Valley Limnological & Algal Bloom Testing Lab', 'laboratory', 'ISO/IEC 17025 Accredited Scope', 'Lake Naivasha water quality and wetland ecology'),
(4, 'Marine Multi-Species Fish & Shellfish Hatchery', 'hatchery', 'National Mariculture Nucleus', 'Mud crab, milkfish, rabbitfish and seaweed culture'),
(5, 'Western Kenya Aquaculture Breeding Nucleus', 'hatchery', 'National Certified Broodstock Hub', 'Annual capacity: 5 million high-vigor tilapia fingerlings'),
(6, 'Riverine & Climate-Resilient Fish Hatchery', 'hatchery', 'National Aquaculture Research Station', 'African catfish, Labeo victorianus and live Artemia culture'),
(7, 'Lake Baringo Fisheries Monitoring Lab', 'laboratory', 'Field Analytical Unit', 'Fish catch assessment and sediment testing'),
(8, 'Lake Turkana Desert Fisheries Research Unit', 'laboratory', 'Remote Field Station', 'Hydroacoustic fish biomass and salinity testing');

-- Seed Research Vessels
INSERT INTO research_vessels (vessel_name, home_port, length_metres, beam_metres, draft_metres, gross_tonnage, max_speed_knots, cruise_speed_knots, endurance_days, scientist_berths, crew_berths, primary_scientific_gear, charter_rate_kes_per_day, charter_rate_usd_per_day, status) VALUES
('RV Mtafiti', 'Port of Kilindini, Mombasa', 53.20, 10.50, 4.20, 1050, 13.50, 10.00, 30, 18, 14, 'Simrad EK80 Scientific Echosounder, Seabird 911plus CTD Rosette, Multibeam Bathymetry, Deepsea Trawl Winch, Wet & Dry Chemistry Labs', 850000.00, 6500.00, 'available'),
('RV Utafiti (Kisumu)', 'Kisumu Pier, Lake Victoria', 17.50, 4.80, 1.80, 48, 11.00, 8.50, 5, 8, 4, 'Dual-Frequency Hydroacoustic Sonar, Limnological Winch, Van Veen Grab Sampler, Water Multiparameter Sondes', 95000.00, 730.00, 'available'),
('RV Albatross (Naivasha)', 'South Lake Base, Lake Naivasha', 10.20, 3.20, 0.90, 12, 18.00, 12.00, 1, 6, 2, 'Limnological Secchi & Profiler Sondes, Plankton Tows, Water Column Samplers', 45000.00, 350.00, 'available'),
('Coastal Survey RIB Pioneer', 'English Point Jetty, Mombasa', 8.50, 2.90, 0.50, 4, 32.00, 22.00, 1, 4, 2, 'High-Precision RTK GPS, Portable Singlebeam Echosounder, Scuba Support Station', 35000.00, 270.00, 'available');

-- Seed Core Enterprise Services
INSERT INTO services (id, category_id, code, title, slug, short_description, full_overview, remarks, turnaround_time, iso_standard, contact_officer_title, contact_email, contact_phone, status, display_order) VALUES
(1, 1, 'KMFRI-LAB-01', 'Laboratory Analytical Services', 'laboratory-analytical-services',
 'Water analysis, fish analysis, microbiology, chemical analysis, environmental analysis and other specialised laboratory tests',
 'KMFRI operates premier accredited analytical laboratories equipped with state-of-the-art instrumentation including GC-MS, AAS, HPLC, and automated nutrient analyzers. We provide rigorous testing of aquatic chemistry, fish tissue safety, microbiology, effluent compliance, heavy metal toxicology, and ocean acidification parameters to support regulatory compliance, export clearance, and scientific investigations.',
 'Government, private sector, researchers, universities, individuals',
 '5 – 7 business days', 'ISO/IEC 17025:2017 Accredited', 'Chief Principal Research Scientist - Laboratory Analytics', 'labservices@kmfri.go.ke', '+254 (0) 41 475151', 'active', 1),

(2, 2, 'KMFRI-CNS-02', 'Technical Consultancy Services', 'technical-consultancy-services',
 'Fisheries, aquaculture, marine science, environmental and blue economy consultancy',
 'Leveraging over four decades of premier marine research across the Western Indian Ocean and East African Great Lakes, KMFRI provides high-level advisory and technical consultancy. We assist County Governments, national ministries, bilateral development partners, and commercial enterprises with Marine Spatial Planning (MSP), fisheries stock assessments, Environmental Impact Assessments (EIA), and Blue Economy masterplans.',
 'Government, counties, private sector, development partners',
 'Project Milestone Based (14 – 60 days)', 'ISO 9001:2015 Certified', 'Director - Marine & Coastal Research Advisory', 'consultancy@kmfri.go.ke', '+254 (0) 20 8021560', 'active', 2),

(3, 3, 'KMFRI-AQU-03', 'Fish & Aquaculture Services', 'fish-and-aquaculture-services',
 'Fingerlings, broodstock, fish feed, Aquariums and related aquaculture services',
 'KMFRI is Kenya’s primary scientific authority in sustainable aquaculture development. Our specialized hatcheries produce genetically certified, disease-free seed stock (Nile Tilapia, African Catfish, Milkfish, and Marine Crabs), optimized locally-sourced floating fish feeds, live feed cultures (Artemia and Spirulina), and turnkey aquarium design for institutional and private clients.',
 'Fish farmers, counties, NGOs, private sector',
 'Immediate to 7 days', 'KEBS & ISO 9001:2015 Certified', 'Head of Aquaculture & Seed Multiplication', 'aquaculture@kmfri.go.ke', '+254 (0) 722 000000', 'active', 3),

(4, 4, 'KMFRI-DAT-04', 'Scientific Data & Information Services', 'scientific-data-and-information-services',
 'GIS, marine datasets, fisheries information, scientific reports and specialised data products, Tide tables and other marine information products',
 'The National Oceanographic Data Center (KeNODC) hosted at KMFRI curates an exhaustive scientific repository of bathymetric surveys, sea surface temperatures, acoustic fish biomass estimates, tidal harmonics, chlorophyll-a trends, and historical catch-effort statistics for Kenya’s Exclusive Economic Zone (EEZ) and inland lakes.',
 'Researchers, consultants, government, universities',
 '1 – 3 business days', 'IOC/IODE Quality Management Standard', 'National Oceanographic Data Coordinator (KeNODC)', 'datarequest@kmfri.go.ke', '+254 (0) 41 475151', 'active', 4),

(5, 5, 'KMFRI-VES-05', 'Research Vessel Hire Services', 'research-vessel-hire-services',
 'Research vessel hire, marine surveys, scientific expeditions and related marine support',
 'KMFRI owns and operates flagship research vessels led by RV Mtafiti, a 53-meter state-of-the-art oceanographic vessel fitted with advanced seabed mapping multibeam echosounders, CTD rosettes, meteorological weather stations, wet and dry laboratories, and deep-water acoustic trawling gear. We provide vessel charter for scientific research cruises, environmental baselines, cable route surveys, and offshore marine observation across Kenya’s 200nm EEZ.',
 'Government, researchers, universities, private sector',
 'Per Cruise Schedule', 'IMO ISM Compliant & ISO 9001:2015', 'Chief Vessel Operations Superintendent', 'vesselops@kmfri.go.ke', '+254 (0) 711 999888', 'active', 5),

(6, 6, 'KMFRI-VAL-06', 'Fish Products & Value-Addition Services', 'fish-products-and-value-addition-services',
 'Product development and post-harvest technology support',
 'Post-harvest losses in Kenya’s fisheries historically reach 20–30%. KMFRI’s Post-Harvest Fish Technology and Value-Addition Incubation Hub provides technical know-how, product formulation, cold chain protocols, smoking/drying innovations, and quality assurance for fish processors, artisanal fisher cooperatives, and agri-business enterprises looking to enter high-value domestic and export markets.',
 'Fish processors, SMEs, cooperatives',
 '7 – 14 business days', 'KEBS Standards & ISO 9001:2015', 'Principal Post-Harvest Fish Technologist', 'postharvest@kmfri.go.ke', '+254 (0) 20 8021562', 'active', 6),

(7, 7, 'KMFRI-EDU-07', 'Educational Visits', 'educational-visits',
 'Museum visits and educational tours',
 'KMFRI opens its scientific laboratories, marine public aquariums, fish biology museum galleries, and research vessels to curious minds. Our guided educational tours offer students, scholars, international delegates, and the general public a front-row immersion into marine biodiversity, ocean science, fish anatomy, mangrove conservation, and blue economy careers.',
 'Schools, universities, tourists, general public',
 'Instant booking confirmation', 'Public Service Customer Care Charter', 'Corporate Communications & Public Relations Officer', 'visits@kmfri.go.ke', '+254 (0) 20 8021560', 'active', 7),

(8, 8, 'KMFRI-TRN-08', 'Training & Capacity Building', 'training-and-capacity-building',
 'Technical training, fisheries, aquaculture, laboratory and marine science courses',
 'Designed to elevate professional competency across the maritime and fisheries sectors, KMFRI’s upcoming Technical Training Institute delivers certified executive and practitioner short courses. Curriculum modules span modern aquaculture management, microbiological laboratory techniques, GIS for marine conservation, and blue carbon project verification.',
 'Coming Soon',
 'Cohort calendar intakes', 'TVETA Accredited Curriculum (In Process)', 'Head of Capacity Development & Training', 'training@kmfri.go.ke', '+254 (0) 20 8021561', 'coming_soon', 8),

(9, 9, 'KMFRI-CNF-09', 'Conference & Meeting Facilities', 'conference-and-meeting-facilities',
 'Conference halls, meeting rooms and associated facilities',
 'Set in tranquil scientific campuses overlooking picturesque coastal bays and lakesides, KMFRI offers modern conference halls, executive boardrooms, and outdoor botanical grounds. Ideal for government retreats, international symposiums, stakeholder workshops, and corporate seminars, our facilities are equipped with high-speed fiber internet, audio-visual systems, and dedicated catering services.',
 'Government, NGOs, private sector, researchers',
 'Instant check / 24h confirmation', 'ISO 9001:2015 Hospitality Standards', 'Facilities & Logistics Administrator', 'facilities@kmfri.go.ke', '+254 (0) 41 475151', 'active', 9),

(10, 10, 'KMFRI-ATT-10', 'Student Attachment & Internship Services', 'student-attachment-and-internship-services',
 'Industrial attachment, internship and practical research placements',
 'In alignment with the Public Service Commission (PSC) guidelines and our institutional mandate to mentor next-generation scientists, KMFRI offers structured 3-month industrial attachments and 1-year graduate internships. Placements are offered in Marine Biology, Limnology, Aquaculture, Chemical Oceanography, Marine Geology, GIS & Remote Sensing, Information Technology, and Procurement.',
 'Students and institutions',
 'Quarterly intake review', 'PSC Internship Policy Compliance', 'Human Resource Development Coordinator', 'attachments@kmfri.go.ke', '+254 (0) 20 8021560', 'active', 10);

-- Seed Pricing Tiers (All Tariffs across 10 services)
INSERT INTO pricing_tiers (service_id, tier_name, unit_description, cost_kes, cost_usd, turnaround_time, vat_applicable, display_order) VALUES
-- Lab Analytics
(1, 'Standard Potability & Physico-Chemical Water Test', 'per sample', 4500.00, 35.00, '5 business days', 0, 1),
(1, 'Full Environmental Compliance Profile (BOD, COD, Heavy Metals)', 'per sample', 12500.00, 95.00, '7 business days', 0, 2),
(1, 'Export Fish Tissue Microbiology & Histamine Screening', 'per batch', 16000.00, 125.00, '4 business days', 0, 3),
(1, 'Heavy Metal Toxicological Profile (5 metals via AAS)', 'per sample', 8000.00, 60.00, '5 business days', 0, 4),
(1, 'Pesticide & Organic Contaminant Residue Screen (GC-MS)', 'per sample', 18500.00, 140.00, '7 business days', 0, 5),

-- Technical Consultancy
(2, 'Preliminary Marine Environmental Appraisal / Site Assessment', 'per site', 180000.00, 1400.00, '10 days', 0, 1),
(2, 'Comprehensive ESIA / Marine Technical Advisory', 'per project milestone', 650000.00, 5000.00, '30 days', 0, 2),
(2, 'County Fisheries & Blue Economy Masterplan Formulation', 'per county blueprint', 1200000.00, 9200.00, '60 days', 0, 3),
(2, 'Aquaculture Commercial Feasibility Study & Engineering Design', 'per farm scheme', 350000.00, 2700.00, '21 days', 0, 4),

-- Fish & Aquaculture
(3, 'Certified Monosex Nile Tilapia Fingerlings (Grade A, 5g)', 'per 1,000 pieces', 7000.00, 55.00, '3 - 7 days', 0, 1),
(3, 'African Sharptooth Catfish Fingerlings (Grade A, 5g)', 'per 1,000 pieces', 8500.00, 65.00, '3 - 7 days', 0, 2),
(3, 'KMFRI Formulated High-Protein Floating Feed (25kg Bag, 32% CP)', 'per 25kg bag', 3400.00, 26.00, 'Immediate stock', 0, 3),
(3, 'Mariculture Mud Crab / Milkfish Seed Package', 'per 500 crablets', 12000.00, 90.00, '10 days', 0, 4),
(3, 'Turnkey Institutional Marine Aquarium Setup & Biota Seeding', 'per custom installation', 95000.00, 730.00, '14 days', 0, 5),

-- Scientific Data & Information
(4, 'Annual Official Kenya Port Tide Tables (Digital / Printed)', 'per annual volume', 2500.00, 20.00, 'Immediate', 0, 1),
(4, 'Standard Spatial GIS Marine Dataset Pack (5km resolution)', 'per theme / region', 25000.00, 195.00, '2 business days', 0, 2),
(4, 'Specialized High-Resolution Bathymetry & Acoustic Biomass Data', 'per survey extract', 75000.00, 580.00, '3 business days', 0, 3),
(4, 'Academic Student Research Dataset Voucher (Subsidized)', 'per verified thesis', 3500.00, 28.00, '2 business days', 0, 4),

-- Research Vessel Hire
(5, 'RV Mtafiti Full Oceanographic Charter (Kenya EEZ, 24h sea day)', 'per day (sea time)', 850000.00, 6500.00, 'Per cruise schedule', 0, 1),
(5, 'RV Mtafiti In-Port / Mobilization & Demobilization Day', 'per day (port standby)', 350000.00, 2700.00, 'Scheduled', 0, 2),
(5, 'Lake Victoria Research Survey Boat (RV Utafiti with skipper)', 'per day (inland lake)', 95000.00, 730.00, '2 days advance', 0, 3),
(5, 'Coastal Inshore Rigid-Inflatable Survey Boat (RIB Pioneer)', 'per day', 35000.00, 270.00, '1 day advance', 0, 4),

-- Value-Addition & Post-Harvest
(6, 'Value-Added Fish Product Formulation (Smoking, Drying, Sausage)', 'per test formulation', 45000.00, 350.00, '10 business days', 0, 1),
(6, 'Fish Processing Quality Audit & HACCP Plan Validation', 'per facility audit', 80000.00, 620.00, '14 business days', 0, 2),
(6, 'Post-Harvest Incubation Suite Access (Weekly Incubator Bench)', 'per weekly bench', 15000.00, 115.00, 'Continuous booking', 0, 3),

-- Educational Visits
(7, 'Primary & Secondary School Students', 'per student', 100.00, 1.00, 'Instant booking', 0, 1),
(7, 'College & University Students', 'per student', 200.00, 2.00, 'Instant booking', 0, 2),
(7, 'Kenyan Adult Citizens & Residents', 'per adult', 300.00, 3.00, 'Instant booking', 0, 3),
(7, 'Non-Resident International Tourists', 'per visitor', 1000.00, 10.00, 'Instant booking', 0, 4),

-- Conference Facilities
(9, 'Full-Day Main Auditorium Hire (Up to 250 Pax, AV & PA system)', 'per day', 50000.00, 390.00, 'Instant confirmation', 0, 1),
(9, 'Half-Day Main Auditorium Hire', 'per half-day', 30000.00, 230.00, 'Instant confirmation', 0, 2),
(9, 'Executive Boardroom Hire with Video Conferencing (Up to 30 Pax)', 'per day', 25000.00, 195.00, 'Instant confirmation', 0, 3),
(9, 'Oceanfront Botanical Gardens for Corporate Functions', 'per event day', 40000.00, 310.00, 'Instant confirmation', 0, 4),

-- Student Attachments
(10, 'Standard 3-Month Undergraduate Industrial Attachment', 'per 3-month term', 3000.00, 25.00, 'Quarterly intake', 0, 1),
(10, 'Postgraduate Practical Research Bench Placement', 'per month', 5000.00, 40.00, 'Per semester intake', 0, 2);

-- Seed Service Capabilities
INSERT INTO service_capabilities (service_id, capability_title, equipment_used, detection_limit, display_order) VALUES
(1, 'Heavy Metal Spectroscopy (Lead, Cadmium, Mercury, Arsenic, Copper)', 'Agilent 240FS Atomic Absorption Spectrophotometer (AAS)', '0.001 mg/kg', 1),
(1, 'Water Nutrient Speciation (Nitrates, Nitrites, Phosphates, Ammonia)', 'Skalar SAN++ Continuous Flow Automated Wet Chemistry Analyzer', '0.005 ug/L', 2),
(1, 'Pathogen Microbiology (Total Coliforms, E. Coli, Salmonella, Vibrio)', 'Bio-Rad CFX96 Real-Time PCR & Sterile Laminar Flow Hoods', '0 CFU/100ml', 3),
(1, 'Marine Carbonate Chemistry & Total Alkalinity', 'Apollo SciTech AS-A2 Automated Titration System', '0.1 umol/kg', 4),
(2, 'Marine Spatial Planning (MSP) & Coastal Zonation Blueprints', 'ArcGIS Pro, QGIS & Satellite Remote Sensing Suites', 'Sub-meter', 1),
(2, 'Acoustic Marine Stock Assessment & Biomass Estimation', 'Simrad EK80 Scientific Split-Beam Transceiver', '0 - 1000m depth', 2),
(2, 'Environmental & Social Impact Assessment (ESIA) License Facilitation', 'NEMA Certified Lead Experts & Specialized Survey Crafts', 'National jurisdiction', 3),
(3, 'Fast-Growth Monosex Nile Tilapia (Oreochromis niloticus) Seed Stock', 'State-of-the-Art Genetic Selection & Temperature-Controlled Hatching Jars', '98% monosex accuracy', 1),
(3, 'High-Survival African Catfish (Clarias gariepinus) Fingerlings', 'Semi-Recirculating Aquaculture System (RAS) with UV Sterilization', 'Grade A vigor', 2),
(3, 'Formulated Floating Extruded Pellets with Optimized FCR (1.2:1)', 'Insta-Pro Extruder & Cold-Pellet Mill Infrastructure', '32% - 40% crude protein', 3),
(4, 'KeNODC High-Resolution Bathymetry & Seabed Geology Maps', 'Reson SeaBat T50-P High-Resolution Multibeam Echosounder', '1m gridded resolution', 1),
(4, 'Satellite-Derived Sea Surface Temperature (SST) & Chlorophyll-a Time Series', 'Copernicus Marine Service & MODIS Ground Downlink Station', '1km spatial grid', 2),
(4, 'Official Annual Tide Tables for Kilindini, Lamu, Malindi and Shimoni', 'Pressure Acoustic Tide Gauges & Harmonic Analysis Software', 'Centimetric water level', 3),
(5, '53m Deep-Sea Oceanographic Cruise Charter with Full Laboratory Suite', 'RV Mtafiti (1050 GT, 30 days endurance, dynamic positioning, 18 scientists)', 'Up to 200nm EEZ', 1),
(5, 'Freshwater Hydroacoustic & Limnological Cruises in Lake Victoria', 'RV Utafiti (17.5m survey vessel with hydroacoustic wet lab)', 'Lake-wide', 2),
(7, 'Guided Educational Tours through the Marine Biodiversity Museum & Public Aquarium', 'Specimen Gallery, Living Coral Aquaria, Giant Turtle Anatomy Displays', 'All age groups', 1),
(9, 'Acoustically Treated 250-Seat Marine Conference Auditorium & Executive Boardrooms', '4K Laser Projection, Dual Wireless Microphones, High-Speed Fiber Internet', 'Up to 250 attendees', 1),
(10, 'Structured 3-Month Industrial Attachments across 12 Scientific Disciplines', 'Direct mentorship by Senior Principal Research Scientists & Fellows', 'Undergraduate / Diploma', 1);

-- Seed Service Requirements
INSERT INTO service_requirements (service_id, requirement_title, requirement_text, is_mandatory, display_order) VALUES
(1, 'Sample Chain of Custody Form', 'All water and fish tissue samples must be accompanied by an official KMFRI Chain of Custody form filled in duplicate.', 1, 1),
(1, 'Sample Temperature Preservation', 'Biological and microbiological specimens must be delivered on ice (0 – 4°C) within 24 hours of field sampling.', 1, 2),
(1, 'Minimum Sample Volume', 'Potable and wastewater submissions require a minimum of 2.0 Litres collected in sterile acid-washed polythene containers.', 1, 3),
(2, 'Official Terms of Reference (TOR)', 'Client must provide clear project TORs, geographical scope coordinates, and expected milestone deliverables.', 1, 1),
(3, 'Biosecurity Vehicle Protocol', 'Transporters picking fingerlings must present cleaned, sanitized containers; temperature matching is conducted at dispatch.', 1, 1),
(4, 'Academic Verification Letter', 'Students requesting subsidized KeNODC dataset vouchers must present a valid university letter and student identification.', 1, 1),
(5, 'Permit & Clearance Protocol', 'Offshore vessel charter clients must submit scientific cruise plans 30 days in advance for Maritime Security Clearance.', 1, 1),
(7, 'Advance Group Booking', 'School excursions exceeding 30 participants must book at least 72 hours prior to ensure dedicated tour guide allocation.', 1, 1),
(10, 'Institutional Insurance Cover', 'Attachment candidates must provide valid student personal accident insurance cover and institutional recommendation letter.', 1, 1);

-- Seed Service-to-Station Mapping
INSERT INTO service_stations_map (service_id, station_id, is_lead_centre) VALUES
(1, 1, 1), (1, 2, 0), (1, 3, 0), (1, 4, 0), -- Lab Analytics (Mombasa Lead, Kisumu, Naivasha, Shimoni)
(2, 1, 1), (2, 2, 0), (2, 3, 0), (2, 7, 0), -- Technical Consultancy
(3, 5, 1), (3, 6, 0), (3, 2, 0), (3, 4, 0), (3, 3, 0), -- Aquaculture (Kegati Lead, Sangoro, Kisumu, Shimoni, Naivasha)
(4, 1, 1), (4, 2, 0), -- Marine Data (Mombasa HQ KeNODC Lead)
(5, 1, 1), (5, 2, 0), -- Vessels (Mombasa HQ RV Mtafiti Lead)
(6, 2, 1), (6, 1, 0), (6, 3, 0), -- Value Addition (Kisumu Lead)
(7, 1, 1), (7, 2, 0), (7, 3, 0), (7, 4, 0), -- Educational Visits (Mombasa Lead)
(8, 1, 1), (8, 2, 0), (8, 3, 0), -- Training Institutes
(9, 1, 1), (9, 2, 0), (9, 3, 0), -- Conference Facilities
(10, 1, 1), (10, 2, 0), (10, 3, 0), (10, 4, 0), (10, 5, 0), (10, 6, 0), (10, 7, 0), (10, 8, 0); -- Placements at all stations

-- Seed Scientific Datasets
INSERT INTO scientific_datasets (dataset_title, dataset_code, coverage_area, spatial_resolution, temporal_range, data_format, tariff_kes, academic_concession_kes, curating_centre) VALUES
('Kenya EEZ High-Resolution Gridded Bathymetry', 'DAT-BATHY-01', 'Kenya Exclusive Economic Zone (EEZ)', '50m x 50m grid', '2015 – 2024', 'GeoTIFF / NetCDF', 75000.00, 5000.00, 'KeNODC - Mombasa'),
('Western Indian Ocean Satellite Sea Surface Temperature', 'DAT-SST-02', 'East African Coastal Current (EACC)', '1km resolution', '2000 – Present', 'NetCDF / CSV', 35000.00, 3500.00, 'KeNODC - Mombasa'),
('Lake Victoria Acoustic Fish Biomass & Distribution', 'DAT-LVIC-03', 'Kenya Waters of Lake Victoria', '2km survey transects', '2010 – 2024', 'Shapefile / Tabular', 45000.00, 4000.00, 'KMFRI Kisumu'),
('Annual Tidal Harmonics & Port Water Levels', 'DAT-TIDE-04', 'Mombasa, Lamu, Malindi, Shimoni', 'Hourly water level', 'Annual Tables', 'PDF / CSV', 2500.00, 500.00, 'KeNODC - Mombasa'),
('Kenya Mangrove & Seagrass Blue Carbon Carbon-Stock Atlas', 'DAT-MANG-05', 'Kwale, Mombasa, Kilifi, Lamu', '10m Sentinel-2 baseline', '2018 – 2024', 'GIS Shapefile', 60000.00, 5000.00, 'KeNODC - Mombasa');

-- Seed Citizen Service Charter
INSERT INTO service_charter (service_id, service_name, statutory_turnaround_time, official_fee_summary, responsible_officer) VALUES
(1, 'Laboratory Water & Fish Analytical Testing', '5 – 7 business days', 'KES 4,500 – 18,500 per sample as per gazetted scope', 'Chief Principal Research Scientist - Analytics'),
(2, 'Marine & Fisheries Technical Consultancy', '14 – 60 days (Milestone-based)', 'Negotiated project tariff based on approved public advisory rates', 'Director - Marine & Coastal Research Advisory'),
(3, 'Certified Fingerlings & Seed Multiplication', 'Immediate to 7 business days', 'KES 7.00 per piece (Tilapia), KES 8.50 (Catfish)', 'Head of Aquaculture & Seed Multiplication'),
(4, 'KeNODC Marine Datasets & Tide Tables', '1 – 3 business days', 'KES 2,500 (Tide Tables) / Standard dataset fees', 'KeNODC Coordinator'),
(5, 'Research Vessel Charter (RV Mtafiti / RV Utafiti)', 'Per Cruise Schedule', 'KES 850,000/day (Mtafiti sea) / KES 95,000/day (Utafiti)', 'Vessel Operations Superintendent'),
(6, 'Post-Harvest Incubation & Value-Addition Training', '7 – 14 business days', 'KES 15,000 – 80,000 per module / audit', 'Principal Post-Harvest Technologist'),
(7, 'Museum & Educational Aquarium Tours', 'Immediate on arrival / booking', 'KES 100 (Students), KES 300 (Adults), KES 1,000 (Non-residents)', 'PR & Corporate Communications Officer'),
(8, 'Professional Short-Course Training Modules', 'Per Course Intake Calendar', 'Gazetted module fee per participant', 'Head of Capacity Development & Training'),
(9, 'Conference Facilities & Meeting Hall Hire', 'Instant check / 24h confirmation', 'KES 25,000 – 50,000 per day', 'Facilities & Logistics Administrator'),
(10, 'Student Industrial Attachment & Internship', 'Quarterly intake review (PSC policy)', 'KES 3,000 per 3-month term', 'Human Resource Development Coordinator');

-- Seed Sample Inquiries & Audit Trail
INSERT INTO service_inquiries (id, reference_number, service_id, pricing_tier_id, preferred_station_id, client_type, full_name, organization, kra_pin, email, phone, estimated_quantity, estimated_cost_kes, client_notes, status) VALUES
(1, 'KMFRI-SRV-2026-8812', 1, 2, 1, 'private', 'Eng. Patrick Mwangi', 'Bamburi Marine Logistics Ltd', 'P051239841K', 'p.mwangi@bamburimarine.co.ke', '+254 722 456789', 3, 37500.00, 'Urgent full environmental compliance profile for port dredging discharge monitoring.', 'quote_issued'),
(2, 'KMFRI-SRV-2026-9041', 3, 10, 5, 'sme', 'Mama Sarah Akinyi', 'Lake Basin Agro-Aqua Enterprise', 'A009124412B', 'akinyi.farms@gmail.com', '+254 733 987654', 10, 70000.00, 'Order for 10,000 certified monosex Nile tilapia fingerlings for pond stocking in Kisii.', 'under_review'),
(3, 'KMFRI-SRV-2026-9215', 5, 19, 1, 'researcher', 'Dr. Elena Rostova', 'Global Ocean Climate Consortium', NULL, 'e.rostova@ocean-consortium.org', '+44 20 7946 0912', 5, 4250000.00, '5-day oceanographic cruise request along North Kenya Banks for CTD & benthic sampling.', 'pending'),
(4, 'KMFRI-SRV-2026-9430', 4, 15, 1, 'university', 'Prof. David Ochieng', 'Technical University of Mombasa', 'P000192831Z', 'd.ochieng@tum.ac.ke', '+254 710 234567', 1, 3500.00, 'Academic student voucher for graduate student thesis bathymetry and current vectors.', 'fulfilled');

-- Seed Inquiry History
INSERT INTO inquiry_status_history (inquiry_id, previous_status, new_status, changed_by, remarks) VALUES
(1, 'pending', 'under_review', 'Senior Analytical Chemist', 'Reviewing sample parameters for heavy metal scope'),
(1, 'under_review', 'quote_issued', 'Accounts Officer', 'Formal quotation issued with 14-day validity'),
(2, 'pending', 'under_review', 'Kegati Hatchery Supervisor', 'Hatchery stock verification for 10,000 fingerlings batch'),
(4, 'pending', 'quote_issued', 'KeNODC Data Officer', 'Student verification completed'),
(4, 'quote_issued', 'fulfilled', 'KeNODC Data Officer', 'Data package sent via secure download link');

-- Seed Client Feedback
INSERT INTO client_feedback (inquiry_id, service_id, client_name, organization, rating_score, turnaround_adherence, scientific_accuracy_rating, customer_comments, testimonial_approved) VALUES
(4, 4, 'Prof. David Ochieng', 'Technical University of Mombasa', 5, 'ahead_of_time', 'excellent', 'Prompt turnaround and impeccable bathymetry spatial datasets. Invaluable for university research.', 1),
(1, 1, 'Eng. Patrick Mwangi', 'Bamburi Marine Logistics Ltd', 5, 'on_time', 'excellent', 'Accredited testing met NEMA and port authority requirements seamlessly.', 1);

-- --------------------------------------------------------------------
-- 4. DATABASE VIEWS FOR RAPID APPLICATION REPORTING
-- --------------------------------------------------------------------

-- View 1: Active Services Comprehensive Overview
DROP VIEW IF EXISTS v_active_services_overview;
CREATE VIEW v_active_services_overview AS
SELECT
  s.id AS service_id,
  s.code AS service_code,
  s.title AS service_title,
  s.slug AS service_slug,
  sc.name AS category_name,
  sc.slug AS category_slug,
  s.remarks AS target_clientele,
  s.turnaround_time,
  s.iso_standard,
  s.contact_officer_title,
  s.contact_email,
  s.contact_phone,
  COUNT(DISTINCT pt.id) AS total_pricing_tiers,
  MIN(pt.cost_kes) AS starting_cost_kes,
  COUNT(DISTINCT sm.station_id) AS accredited_stations_count
FROM services s
JOIN service_categories sc ON s.category_id = sc.id
LEFT JOIN pricing_tiers pt ON s.id = pt.service_id AND pt.is_active = 1
LEFT JOIN service_stations_map sm ON s.id = sm.service_id
WHERE s.status = 'active'
GROUP BY s.id, sc.id;

-- View 2: Complete Tariffs & Pricing Schedule
DROP VIEW IF EXISTS v_tariffs_schedule;
CREATE VIEW v_tariffs_schedule AS
SELECT
  s.code AS service_code,
  s.title AS service_title,
  sc.name AS category_name,
  pt.tier_name,
  pt.unit_description,
  pt.cost_kes,
  pt.cost_usd,
  pt.turnaround_time AS tier_turnaround_time,
  s.iso_standard
FROM pricing_tiers pt
JOIN services s ON pt.service_id = s.id
JOIN service_categories sc ON s.category_id = sc.id
WHERE pt.is_active = 1
ORDER BY sc.display_order ASC, s.display_order ASC, pt.display_order ASC;

-- View 3: Station Service Capabilities Matrix
DROP VIEW IF EXISTS v_station_service_capabilities;
CREATE VIEW v_station_service_capabilities AS
SELECT
  rs.code AS station_code,
  rs.name AS station_name,
  rs.county,
  s.code AS service_code,
  s.title AS service_title,
  sc.name AS category_name,
  sm.is_lead_centre,
  rs.contact_phone,
  rs.contact_email
FROM service_stations_map sm
JOIN research_stations rs ON sm.station_id = rs.id
JOIN services s ON sm.service_id = s.id
JOIN service_categories sc ON s.category_id = sc.id
ORDER BY rs.name ASC, s.title ASC;

-- View 4: Recent Inquiries Dashboard View
DROP VIEW IF EXISTS v_recent_inquiries;
CREATE VIEW v_recent_inquiries AS
SELECT
  si.reference_number,
  si.created_at,
  si.client_type,
  si.full_name,
  si.organization,
  si.email,
  s.code AS service_code,
  s.title AS service_title,
  pt.tier_name,
  si.estimated_cost_kes,
  si.status,
  rs.name AS preferred_station
FROM service_inquiries si
JOIN services s ON si.service_id = s.id
LEFT JOIN pricing_tiers pt ON si.pricing_tier_id = pt.id
LEFT JOIN research_stations rs ON si.preferred_station_id = rs.id
ORDER BY si.created_at DESC;

-- --------------------------------------------------------------------
-- 5. STORED PROCEDURES
-- --------------------------------------------------------------------

DELIMITER //

-- Procedure 1: Register New Service Inquiry with Auto-Generated Reference
DROP PROCEDURE IF EXISTS sp_register_service_inquiry //
CREATE PROCEDURE sp_register_service_inquiry(
  IN p_service_id INT UNSIGNED,
  IN p_pricing_tier_id INT UNSIGNED,
  IN p_station_id INT UNSIGNED,
  IN p_client_type VARCHAR(20),
  IN p_full_name VARCHAR(150),
  IN p_organization VARCHAR(200),
  IN p_kra_pin VARCHAR(20),
  IN p_email VARCHAR(150),
  IN p_phone VARCHAR(50),
  IN p_quantity INT UNSIGNED,
  IN p_notes TEXT,
  IN p_ip VARCHAR(45),
  OUT p_reference VARCHAR(50)
)
BEGIN
  DECLARE v_cost_kes DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_unit_cost DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_rand_suffix VARCHAR(4);

  -- Calculate cost if tier provided
  IF p_pricing_tier_id IS NOT NULL THEN
    SELECT cost_kes INTO v_unit_cost
    FROM pricing_tiers
    WHERE id = p_pricing_tier_id;

    SET v_cost_kes = v_unit_cost * COALESCE(p_quantity, 1);
  END IF;

  -- Generate unique reference: KMFRI-SRV-YYYY-XXXX
  SET v_rand_suffix = LPAD(FLOOR(RAND() * 9000 + 1000), 4, '0');
  SET p_reference = CONCAT('KMFRI-SRV-', YEAR(NOW()), '-', v_rand_suffix);

  -- Insert into inquiries
  INSERT INTO service_inquiries (
    reference_number, service_id, pricing_tier_id, preferred_station_id,
    client_type, full_name, organization, kra_pin, email, phone,
    estimated_quantity, estimated_cost_kes, client_notes, ip_address, status
  ) VALUES (
    p_reference, p_service_id, p_pricing_tier_id, p_station_id,
    p_client_type, p_full_name, p_organization, p_kra_pin, p_email, p_phone,
    COALESCE(p_quantity, 1), v_cost_kes, p_notes, p_ip, 'pending'
  );

  -- Record Initial History
  INSERT INTO inquiry_status_history (inquiry_id, previous_status, new_status, changed_by, remarks)
  VALUES (LAST_INSERT_ID(), NULL, 'pending', 'Public Sub-Portal', 'Customer submitted online quotation request');

END //

-- Procedure 2: Fetch Service Details with Tiers & Accredited Stations
DROP PROCEDURE IF EXISTS sp_get_service_full_details //
CREATE PROCEDURE sp_get_service_full_details(
  IN p_slug VARCHAR(200)
)
BEGIN
  -- 1. Main Service Row
  SELECT
    s.*,
    sc.name AS category_name,
    sc.slug AS category_slug,
    sc.icon AS category_icon
  FROM services s
  -- ==================================================================
  -- NOTE: The supplied script was truncated at "JOIN service_categories sc ON s.cat".
  -- Everything below this line completes Procedure 2 following the
  -- procedure's stated purpose ("Service Details with Tiers & Accredited
  -- Stations"). Replace it with the original remainder if available.
  -- ==================================================================
  JOIN service_categories sc ON s.category_id = sc.id
  WHERE s.slug = p_slug;

  -- 2. Active Pricing Tiers
  SELECT pt.*
  FROM pricing_tiers pt
  JOIN services s ON pt.service_id = s.id
  WHERE s.slug = p_slug AND pt.is_active = 1
  ORDER BY pt.display_order ASC;

  -- 3. Accredited Stations (lead centre first)
  SELECT rs.id, rs.name, rs.code, rs.county, rs.contact_email, rs.contact_phone, sm.is_lead_centre
  FROM service_stations_map sm
  JOIN research_stations rs ON sm.station_id = rs.id
  JOIN services s ON sm.service_id = s.id
  WHERE s.slug = p_slug
  ORDER BY sm.is_lead_centre DESC, rs.name ASC;

  -- 4. Technical Capabilities
  SELECT sca.*
  FROM service_capabilities sca
  JOIN services s ON sca.service_id = s.id
  WHERE s.slug = p_slug
  ORDER BY sca.display_order ASC;

  -- 5. Submission Requirements
  SELECT sr.*
  FROM service_requirements sr
  JOIN services s ON sr.service_id = s.id
  WHERE s.slug = p_slug
  ORDER BY sr.display_order ASC;
END //

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
