export interface CodeFile {
  path: string;
  filename: string;
  language: 'php' | 'sql' | 'css' | 'html' | 'javascript' | 'apache' | 'markdown';
  category: 'config' | 'core' | 'controllers' | 'models' | 'views' | 'database' | 'integration' | 'docs';
  description: string;
  content: string;
}

export const PHP_CODEBASE: CodeFile[] = [
  {
    path: 'database/kmfri_services.sql',
    filename: 'kmfri_services.sql',
    language: 'sql',
    category: 'database',
    description: 'Production MySQL schema with relational tables, foreign keys, indexes, and full seed data for all 10 KMFRI services.',
    content: `-- ====================================================================
-- Kenya Marine and Fisheries Research Institute (KMFRI)
-- Enterprise & Commercial Services Sub-Website Database Schema
-- Charset: utf8mb4 | Engine: InnoDB | MySQL 8.0+ Compatible
-- ====================================================================

CREATE DATABASE IF NOT EXISTS kmfri_services_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kmfri_services_db;

-- 1. Service Categories Table
DROP TABLE IF EXISTS service_categories;
CREATE TABLE service_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  icon VARCHAR(50) DEFAULT 'flask',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Research Stations Table
DROP TABLE IF EXISTS research_stations;
CREATE TABLE research_stations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  location VARCHAR(200) NOT NULL,
  county VARCHAR(100) NOT NULL,
  head_of_station VARCHAR(150) NOT NULL,
  contact_email VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Core Enterprise Services Table
DROP TABLE IF EXISTS services;
CREATE TABLE services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  full_overview LONGTEXT NOT NULL,
  remarks VARCHAR(255) NOT NULL COMMENT 'Target audiences from official catalogue',
  turnaround_time VARCHAR(100) NOT NULL,
  iso_standard VARCHAR(100) DEFAULT 'ISO 9001:2015 Certified',
  contact_officer_title VARCHAR(150) NOT NULL,
  contact_email VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  featured_image VARCHAR(255) NULL,
  status ENUM('active', 'coming_soon', 'pilot') DEFAULT 'active',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE RESTRICT,
  FULLTEXT KEY ft_title_desc (title, short_description, full_overview)
) ENGINE=InnoDB;

-- 4. Service Pricing & Tariffs Table
DROP TABLE IF EXISTS pricing_tiers;
CREATE TABLE pricing_tiers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id INT UNSIGNED NOT NULL,
  tier_name VARCHAR(200) NOT NULL,
  unit_description VARCHAR(100) NOT NULL COMMENT 'e.g. per sample, per day, per 1000 pieces',
  cost_kes DECIMAL(12, 2) NOT NULL,
  cost_usd DECIMAL(10, 2) NULL,
  turnaround_time VARCHAR(100) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Service Requirements & Sample Protocols Table
DROP TABLE IF EXISTS service_requirements;
CREATE TABLE service_requirements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id INT UNSIGNED NOT NULL,
  requirement_text TEXT NOT NULL,
  display_order INT DEFAULT 0,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Service Capabilities Table
DROP TABLE IF EXISTS service_capabilities;
CREATE TABLE service_capabilities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id INT UNSIGNED NOT NULL,
  capability_title VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 0,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Service-to-Station Mapping Table (Many-to-Many)
DROP TABLE IF EXISTS service_stations_map;
CREATE TABLE service_stations_map (
  service_id INT UNSIGNED NOT NULL,
  station_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (service_id, station_id),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES research_stations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Customer Service Inquiries & Quote Requests Table
DROP TABLE IF EXISTS service_inquiries;
CREATE TABLE service_inquiries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(50) NOT NULL UNIQUE,
  service_id INT UNSIGNED NOT NULL,
  pricing_tier_id INT UNSIGNED NULL,
  client_type ENUM('government', 'county', 'private', 'researcher', 'university', 'sme', 'individual') NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  organization VARCHAR(200) NOT NULL,
  kra_pin VARCHAR(20) NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  preferred_station_id INT UNSIGNED NULL,
  estimated_quantity INT DEFAULT 1,
  estimated_cost_kes DECIMAL(12, 2) DEFAULT 0.00,
  client_notes TEXT NULL,
  status ENUM('pending', 'under_review', 'quote_issued', 'fulfilled', 'cancelled') DEFAULT 'pending',
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  FOREIGN KEY (pricing_tier_id) REFERENCES pricing_tiers(id) ON DELETE SET NULL,
  FOREIGN KEY (preferred_station_id) REFERENCES research_stations(id) ON DELETE SET NULL,
  INDEX idx_reference (reference_number),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ====================================================================
-- SEED DATA: All 10 Proposed Commercial Services from PDF Catalogue
-- ====================================================================

-- Seed Categories
INSERT INTO service_categories (id, name, slug, description, icon, display_order) VALUES
(1, 'Analytical Laboratories', 'analytical-laboratories', 'Accredited physical, chemical, microbiological and environmental testing', 'microscope', 1),
(2, 'Advisory & Consultancy', 'advisory-consultancy', 'Specialized marine, fisheries and blue economy expert advisory', 'briefcase', 2),
(3, 'Aquaculture & Seed Production', 'aquaculture-seed', 'Certified fingerlings, broodstock, high-protein feed and technical support', 'fish', 3),
(4, 'Marine Data & Informatics', 'marine-data', 'Oceanographic datasets, GIS layers, tide tables and scientific reports', 'database', 4),
(5, 'Research Vessels & Marine Hire', 'vessel-hire', 'Offshore oceanographic research vessels and survey crafts', 'ship', 5),
(6, 'Post-Harvest & Value Addition', 'value-addition', 'Fish processing incubation, modern drying kilns and HACCP standards', 'package', 6),
(7, 'Education & Scientific Tours', 'education-tours', 'Marine museums, public aquariums, student and tourist visits', 'users', 7),
(8, 'Professional Training', 'professional-training', 'Certified technical courses in fisheries, aquaculture and laboratory science', 'award', 8),
(9, 'Conference & Hospitality', 'conference-facilities', 'Oceanfront and lakeside conference halls, boardrooms and event grounds', 'building', 9),
(10, 'Student Placements', 'student-attachments', 'Industrial attachments and practical scientific research internships', 'graduation-cap', 10);

-- Seed Research Stations
INSERT INTO research_stations (id, name, code, location, county, head_of_station, contact_email, contact_phone, latitude, longitude) VALUES
(1, 'Mombasa Headquarters & Marine Centre', 'KMFRI-MBA', 'English Point, Mkomani, Mombasa', 'Mombasa', 'Prof. James Njiru, PhD', 'director@kmfri.go.ke', '+254 41 475151', -4.0531, 39.6806),
(2, 'Kisumu Centre (Freshwater Systems)', 'KMFRI-KSM', 'Off Airport Road, Kisumu', 'Kisumu', 'Dr. Christopher Aura, PhD', 'kisumu@kmfri.go.ke', '+254 57 2021461', -0.1022, 34.7617),
(3, 'Naivasha Centre (Rift Valley Lakes)', 'KMFRI-NVS', 'South Lake Road, Naivasha', 'Nakuru', 'Dr. Edna Waithaka', 'naivasha@kmfri.go.ke', '+254 50 2020277', -0.7172, 36.4310),
(4, 'Shimoni Mariculture Centre', 'KMFRI-SHM', 'Shimoni Peninsula', 'Kwale', 'Dr. David Mirera, PhD', 'shimoni@kmfri.go.ke', '+254 722 123456', -4.6478, 39.3822),
(5, 'Kegati Aquaculture Centre', 'KMFRI-KGT', 'Kegati, Kisii', 'Kisii', 'Dr. Paul Orina, PhD', 'kegati@kmfri.go.ke', '+254 58 30123', -0.6817, 34.7891),
(6, 'Sangoro Aquaculture Research Station', 'KMFRI-SNG', 'Pap-Onditi, Nyakach', 'Kisumu', 'Dr. Kevin Obiero, PhD', 'sangoro@kmfri.go.ke', '+254 57 2023900', -0.3475, 34.9312),
(7, 'Baringo Station (ASAL Lakes)', 'KMFRI-BRG', 'Kampi ya Samaki, Lake Baringo', 'Baringo', 'Cyrus Kilonzi', 'baringo@kmfri.go.ke', '+254 53 2031122', 0.6225, 36.0125),
(8, 'Turkana Station (Desert Lake)', 'KMFRI-TRK', 'Kalokol, Lake Turkana', 'Turkana', 'James Last Keyombe', 'turkana@kmfri.go.ke', '+254 54 21233', 3.5292, 35.8450);

-- Seed Core Services (Matching PDF)
INSERT INTO services (id, category_id, code, title, slug, short_description, full_overview, remarks, turnaround_time, iso_standard, contact_officer_title, contact_email, contact_phone, status, display_order) VALUES
(1, 1, 'KMFRI-LAB-01', 'Laboratory Analytical Services', 'laboratory-analytical-services', 
 'Water analysis, fish analysis, microbiology, chemical analysis, environmental analysis and other specialised laboratory tests',
 'KMFRI operates premier accredited analytical laboratories equipped with state-of-the-art instrumentation including GC-MS, AAS, HPLC, and automated nutrient analyzers. We provide rigorous testing of aquatic chemistry, fish tissue safety, microbiology, effluent compliance, heavy metal toxicology, and ocean acidification parameters to support regulatory compliance, export clearance, and scientific investigations.',
 'Government, private sector, researchers, universities, individuals',
 '5 – 7 business days', 'ISO/IEC 17025:2017 Accredited', 'Chief Principal Research Scientist - Laboratory Analytics', 'labservices@kmfri.go.ke', '+254 41 475151', 'active', 1),

(2, 2, 'KMFRI-CNS-02', 'Technical Consultancy Services', 'technical-consultancy-services',
 'Fisheries, aquaculture, marine science, environmental and blue economy consultancy',
 'Leveraging over four decades of premier marine research across the Western Indian Ocean and East African Great Lakes, KMFRI provides high-level advisory and technical consultancy. We assist County Governments, national ministries, bilateral development partners, and commercial enterprises with Marine Spatial Planning (MSP), fisheries stock assessments, Environmental Impact Assessments (EIA), and Blue Economy masterplans.',
 'Government, counties, private sector, development partners',
 'Project Milestone Based (14 – 60 days)', 'ISO 9001:2015 Certified', 'Director - Marine & Coastal Research Advisory', 'consultancy@kmfri.go.ke', '+254 20 8021560', 'active', 2),

(3, 3, 'KMFRI-AQU-03', 'Fish & Aquaculture Services', 'fish-and-aquaculture-services',
 'Fingerlings, broodstock, fish feed, Aquariums and related aquaculture services',
 'KMFRI is Kenya’s primary scientific authority in sustainable aquaculture development. Our specialized hatcheries produce genetically certified, disease-free seed stock (Nile Tilapia, African Catfish, Milkfish, and Marine Crabs), optimized locally-sourced floating fish feeds, live feed cultures (Artemia and Spirulina), and turnkey aquarium design for institutional and private clients.',
 'Fish farmers, counties, NGOs, private sector',
 'Immediate to 7 days', 'KEBS & ISO 9001:2015', 'Head of Aquaculture & Seed Multiplication', 'aquaculture@kmfri.go.ke', '+254 722 000000', 'active', 3),

(4, 4, 'KMFRI-DAT-04', 'Scientific Data & Information Services', 'scientific-data-and-information-services',
 'GIS, marine datasets, fisheries information, scientific reports and specialised data products, Tide tables and other marine information products',
 'The National Oceanographic Data Center (KeNODC) hosted at KMFRI curates an exhaustive scientific repository of bathymetric surveys, sea surface temperatures, acoustic fish biomass estimates, tidal harmonics, chlorophyll-a trends, and historical catch-effort statistics for Kenya’s Exclusive Economic Zone (EEZ) and inland lakes.',
 'Researchers, consultants, government, universities',
 '1 – 3 business days', 'IOC/IODE Quality Management', 'National Oceanographic Data Coordinator (KeNODC)', 'datarequest@kmfri.go.ke', '+254 41 475151', 'active', 4),

(5, 5, 'KMFRI-VES-05', 'Research Vessel Hire Services', 'research-vessel-hire-services',
 'Research vessel hire, marine surveys, scientific expeditions and related marine support',
 'KMFRI owns and operates flagship research vessels led by RV Mtafiti, a 53-meter state-of-the-art oceanographic vessel fitted with advanced seabed mapping multibeam echosounders, CTD rosettes, meteorological weather stations, wet and dry laboratories, and deep-water acoustic trawling gear. We provide vessel charter for scientific research cruises, environmental baselines, cable route surveys, and offshore marine observation across Kenya’s 200nm EEZ.',
 'Government, researchers, universities, private sector',
 'Per Cruise Schedule', 'IMO ISM Compliant & ISO 9001:2015', 'Chief Vessel Operations Superintendent', 'vesselops@kmfri.go.ke', '+254 711 999888', 'active', 5),

(6, 6, 'KMFRI-VAL-06', 'Fish Products & Value-Addition Services', 'fish-products-and-value-addition-services',
 'Product development and post-harvest technology support',
 'Post-harvest losses in Kenya’s fisheries historically reach 20–30%. KMFRI’s Post-Harvest Fish Technology and Value-Addition Incubation Hub provides technical know-how, product formulation, cold chain protocols, smoking/drying innovations, and quality assurance for fish processors, artisanal fisher cooperatives, and agri-business enterprises looking to enter high-value domestic and export markets.',
 'Fish processors, SMEs, cooperatives',
 '7 – 14 business days', 'KEBS Standards & ISO 9001:2015', 'Principal Post-Harvest Fish Technologist', 'postharvest@kmfri.go.ke', '+254 20 8021562', 'active', 6),

(7, 7, 'KMFRI-EDU-07', 'Educational Visits', 'educational-visits',
 'Museum visits and educational tours',
 'KMFRI opens its scientific laboratories, marine public aquariums, fish biology museum galleries, and research vessels to curious minds. Our guided educational tours offer students, scholars, international delegates, and the general public a front-row immersion into marine biodiversity, ocean science, fish anatomy, mangrove conservation, and blue economy careers.',
 'Schools, universities, tourists, general public',
 'Instant booking confirmation', 'Public Service Customer Care Charter', 'Corporate Communications & Public Relations Officer', 'visits@kmfri.go.ke', '+254 20 8021560', 'active', 7),

(8, 8, 'KMFRI-TRN-08', 'Training & Capacity Building', 'training-and-capacity-building',
 'Technical training, fisheries, aquaculture, laboratory and marine science courses',
 'Designed to elevate professional competency across the maritime and fisheries sectors, KMFRI’s upcoming Technical Training Institute delivers certified executive and practitioner short courses. Curriculum modules span modern aquaculture management, microbiological laboratory techniques, GIS for marine conservation, and blue carbon project verification.',
 'Coming Soon',
 'Cohort calendar intakes', 'TVETA Accredited Curriculum (In Process)', 'Head of Capacity Development & Training', 'training@kmfri.go.ke', '+254 20 8021561', 'coming_soon', 8),

(9, 9, 'KMFRI-CNF-09', 'Conference & Meeting Facilities', 'conference-and-meeting-facilities',
 'Conference halls, meeting rooms and associated facilities',
 'Set in tranquil scientific campuses overlooking picturesque coastal bays and lakesides, KMFRI offers modern conference halls, executive boardrooms, and outdoor botanical grounds. Ideal for government retreats, international symposiums, stakeholder workshops, and corporate seminars, our facilities are equipped with high-speed fiber internet, audio-visual systems, and dedicated catering services.',
 'Government, NGOs, private sector, researchers',
 'Instant check / 24h confirmation', 'ISO 9001:2015 Hospitality Standards', 'Facilities & Logistics Administrator', 'facilities@kmfri.go.ke', '+254 41 475151', 'active', 9),

(10, 10, 'KMFRI-ATT-10', 'Student Attachment & Internship Services', 'student-attachment-and-internship-services',
 'Industrial attachment, internship and practical research placements',
 'In alignment with the Public Service Commission (PSC) guidelines and our institutional mandate to mentor next-generation scientists, KMFRI offers structured 3-month industrial attachments and 1-year graduate internships. Placements are offered in Marine Biology, Limnology, Aquaculture, Chemical Oceanography, Marine Geology, GIS & Remote Sensing, Information Technology, and Procurement.',
 'Students and institutions',
 'Quarterly intake review', 'PSC Internship Policy Compliance', 'Human Resource Development Coordinator', 'attachments@kmfri.go.ke', '+254 20 8021560', 'active', 10);

-- Seed Pricing Tiers for Laboratory Services
INSERT INTO pricing_tiers (service_id, tier_name, unit_description, cost_kes, cost_usd, turnaround_time) VALUES
(1, 'Standard Potability & Physico-Chemical Water Test', 'per sample', 4500.00, 35.00, '5 days'),
(1, 'Full Environmental Compliance Profile (BOD, COD, Heavy Metals)', 'per sample', 12500.00, 95.00, '7 days'),
(1, 'Export Fish Tissue Microbiology & Histamine Screening', 'per batch', 16000.00, 125.00, '4 days'),
(1, 'Heavy Metal Toxicological Profile (5 metals via AAS)', 'per sample', 8000.00, 60.00, '5 days'),

-- Seed Pricing Tiers for Technical Consultancy
(2, 'Preliminary Marine Environmental Appraisal / Site Assessment', 'per site', 180000.00, 1400.00, '10 days'),
(2, 'Comprehensive ESIA / Marine Technical Advisory', 'per project milestone', 650000.00, 5000.00, '30 days'),
(2, 'County Fisheries & Blue Economy Masterplan Formulation', 'per county blueprint', 1200000.00, 9200.00, '60 days'),

-- Seed Pricing Tiers for Aquaculture
(3, 'Certified Monosex Nile Tilapia Fingerlings (Grade A, 5g)', 'per 1,000 pieces', 7000.00, 55.00, '3 - 7 days'),
(3, 'African Sharptooth Catfish Fingerlings (Grade A)', 'per 1,000 pieces', 8500.00, 65.00, '3 - 7 days'),
(3, 'KMFRI Formulated High-Protein Floating Feed (25kg Bag, 32% CP)', 'per 25kg bag', 3400.00, 26.00, 'In Stock'),
(3, 'Mariculture Mud Crab / Milkfish Seed Package', 'per 500 crablets', 12000.00, 90.00, '10 days'),

-- Seed Pricing Tiers for Marine Data
(4, 'Annual Official Kenya Port Tide Tables (Digital / Printed)', 'per annual volume', 2500.00, 20.00, 'Immediate'),
(4, 'Standard Spatial GIS Marine Dataset Pack (5km resolution)', 'per theme / region', 25000.00, 195.00, '2 days'),
(4, 'Specialized High-Resolution Bathymetry & Acoustic Biomass Data', 'per project survey extract', 75000.00, 580.00, '3 days'),
(4, 'Academic Student Research Dataset Voucher (Subsidized)', 'per verified student thesis', 3500.00, 28.00, '2 days'),

-- Seed Pricing Tiers for Vessel Hire (RV Mtafiti)
(5, 'RV Mtafiti Full Oceanographic Charter (Kenya EEZ, 24h operational day)', 'per day (sea time)', 850000.00, 6500.00, 'Scheduled cruise'),
(5, 'RV Mtafiti In-Port / Mobilization & Demobilization Day', 'per day (port standby)', 350000.00, 2700.00, 'Scheduled'),
(5, 'Lake Victoria Research Survey Boat (RV Utafiti with skipper)', 'per day (inland lake)', 95000.00, 730.00, '2 days advance'),
(5, 'Coastal Inshore Rigid-Inflatable Survey Boat (RIB)', 'per day', 45000.00, 350.00, '1 day advance'),

-- Seed Pricing Tiers for Educational Visits
(7, 'Primary & Secondary School Students', 'per student', 100.00, 1.00, 'Instant'),
(7, 'College & University Students', 'per student', 200.00, 2.00, 'Instant'),
(7, 'Kenyan Adult Citizens & Residents', 'per adult', 300.00, 3.00, 'Instant'),
(7, 'Non-Resident International Tourists', 'per visitor', 1000.00, 10.00, 'Instant'),

-- Seed Pricing Tiers for Conference Facilities
(9, 'Full-Day Main Auditorium Hire (Up to 250 Pax, with AV & PA system)', 'per day', 50000.00, 390.00, 'Immediate'),
(9, 'Half-Day Main Auditorium Hire', 'per half-day', 30000.00, 230.00, 'Immediate'),
(9, 'Executive Boardroom Hire with Video Conferencing (Up to 30 Pax)', 'per day', 25000.00, 195.00, 'Immediate'),

-- Seed Pricing Tiers for Student Attachment
(10, 'Standard 3-Month Undergraduate Industrial Attachment', 'per 3-month term', 3000.00, 25.00, 'Quarterly intake'),
(10, 'Postgraduate Practical Research Bench Placement', 'per month', 5000.00, 40.00, 'Per semester');

-- Seed Mapping: Services to Stations
INSERT INTO service_stations_map (service_id, station_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), -- Lab analytics available at Mombasa, Kisumu, Naivasha, Shimoni
(2, 1), (2, 2), (2, 3), (2, 7), -- Technical consultancy
(3, 2), (3, 3), (3, 4), (3, 5), (3, 6), -- Aquaculture at Kegati, Sangoro, Kisumu, Shimoni, Naivasha
(4, 1), (4, 2), -- Data Center KeNODC at Mombasa HQ and Kisumu
(5, 1), (5, 2), -- Vessels at Mombasa (Kilindini) and Kisumu (Lake Victoria)
(6, 2), (6, 1), (6, 3), (6, 7), -- Value addition at Kisumu, Mombasa, Naivasha, Baringo
(7, 1), (7, 2), (7, 3), (7, 4), -- Educational visits at Mombasa Museum, Kisumu Aquarium, Naivasha
(8, 1), (8, 2), (8, 3), -- Training institutes
(9, 1), (9, 2), (9, 3), -- Conference facilities at Mombasa, Kisumu, Naivasha
(10, 1), (10, 2), (10, 3), (10, 4), (10, 5), (10, 6), (10, 7), (10, 8); -- Attachments at all stations
`
  },
  {
    path: 'config/database.php',
    filename: 'database.php',
    language: 'php',
    category: 'config',
    description: 'PDO Singleton Database Connection Class with prepared statements, error mode exception, and UTF-8 charset.',
    content: `<?php
/**
 * Kenya Marine and Fisheries Research Institute (KMFRI)
 * Database Connection Configuration (PDO Singleton)
 */

declare(strict_types=1);

namespace KMFRI\\Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    private function __construct() {}
    private function __clone() {}

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $host = getenv('DB_HOST') ?: '127.0.0.1';
            $port = getenv('DB_PORT') ?: '3306';
            $dbname = getenv('DB_NAME') ?: 'kmfri_services_db';
            $user = getenv('DB_USER') ?: 'kmfri_user';
            $pass = getenv('DB_PASS') ?: 'Secur3_KmFr1_2026!';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                // In production, log to secure file and render user-friendly message
                error_log("KMFRI DB Connection Error: " . $e->getMessage());
                http_response_code(503);
                die("The KMFRI Enterprise Services Database is temporarily unavailable. Please try again shortly.");
            }
        }

        return self::$instance;
    }
}
`
  },
  {
    path: 'core/Router.php',
    filename: 'Router.php',
    language: 'php',
    category: 'core',
    description: 'Lightweight RESTful front-controller Router supporting Clean URLs, parameters, and HTTP methods.',
    content: `<?php
/**
 * Kenya Marine and Fisheries Research Institute (KMFRI)
 * Core Request Router for Clean URLs
 */

declare(strict_types=1);

namespace KMFRI\\Core;

class Router
{
    private array $routes = [];

    public function get(string $path, array $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, array $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    private function addRoute(string $method, string $path, array $handler): void
    {
        // Convert route pattern with parameters e.g. /services/{slug} to regex
        $regex = preg_replace('/\\{([a-zA-Z0-9_]+)\\}/', '(?P<$1>[^/]+)', $path);
        $regex = "#^" . $regex . "$#";

        $this->routes[] = [
            'method'  => $method,
            'pattern' => $regex,
            'handler' => $handler
        ];
    }

    public function dispatch(): void
    {
        $requestMethod = $_SERVER['REQUEST_METHOD'];
        $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Remove trailing slash if not root
        if ($requestUri !== '/' && str_ends_with($requestUri, '/')) {
            $requestUri = rtrim($requestUri, '/');
        }

        foreach ($this->routes as $route) {
            if ($route['method'] === $requestMethod && preg_match($route['pattern'], $requestUri, $matches)) {
                // Filter string keys for parameters
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                
                [$controllerClass, $method] = $route['handler'];
                $controller = new $controllerClass();
                call_user_func_array([$controller, $method], array_values($params));
                return;
            }
        }

        // 404 Not Found
        http_response_code(404);
        require_once __DIR__ . '/../views/errors/404.php';
    }
}
`
  },
  {
    path: 'models/Service.php',
    filename: 'Service.php',
    language: 'php',
    category: 'models',
    description: 'Service Repository model handling database interactions with prepared statements.',
    content: `<?php
/**
 * Kenya Marine and Fisheries Research Institute (KMFRI)
 * Service Repository Model
 */

declare(strict_types=1);

namespace KMFRI\\Models;

use KMFRI\\Config\\Database;
use PDO;

class Service
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Retrieve all active enterprise services with category details
     */
    public function getAll(array $filters = []): array
    {
        $sql = "SELECT s.*, c.name AS category_name, c.slug AS category_slug 
                FROM services s
                JOIN service_categories c ON s.category_id = c.id
                WHERE 1=1";
        
        $params = [];

        if (!empty($filters['category_slug'])) {
            $sql .= " AND c.slug = :category_slug";
            $params[':category_slug'] = $filters['category_slug'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (s.title LIKE :search OR s.short_description LIKE :search OR s.remarks LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $sql .= " ORDER BY s.display_order ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Find single service by unique slug with related pricing & stations
     */
    public function findBySlug(string $slug): ?array
    {
        $sql = "SELECT s.*, c.name AS category_name, c.slug AS category_slug 
                FROM services s
                JOIN service_categories c ON s.category_id = c.id
                WHERE s.slug = :slug LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':slug' => $slug]);
        $service = $stmt->fetch();

        if (!$service) {
            return null;
        }

        // Attach pricing tiers
        $pricingStmt = $this->db->prepare(
            "SELECT * FROM pricing_tiers WHERE service_id = :id AND is_active = 1 ORDER BY cost_kes ASC"
        );
        $pricingStmt->execute([':id' => $service['id']]);
        $service['pricing_tiers'] = $pricingStmt->fetchAll();

        // Attach stations offering this service
        $stationStmt = $this->db->prepare(
            "SELECT rs.* FROM research_stations rs
             JOIN service_stations_map m ON rs.id = m.station_id
             WHERE m.service_id = :id"
        );
        $stationStmt->execute([':id' => $service['id']]);
        $service['stations'] = $stationStmt->fetchAll();

        return $service;
    }
}
`
  },
  {
    path: 'controllers/ServiceController.php',
    filename: 'ServiceController.php',
    language: 'php',
    category: 'controllers',
    description: 'Service Controller for the public sub-site directory and detail pages.',
    content: `<?php
/**
 * Kenya Marine and Fisheries Research Institute (KMFRI)
 * Service Controller
 */

declare(strict_types=1);

namespace KMFRI\\Controllers;

use KMFRI\\Models\\Service;

class ServiceController
{
    private Service $serviceModel;

    public function __construct()
    {
        $this->serviceModel = new Service();
    }

    /**
     * Services Hub Home Page
     */
    public function home(): void
    {
        $featuredServices = $this->serviceModel->getAll();
        $pageTitle = "KMFRI Commercial & Enterprise Services Hub";
        require_once __DIR__ . '/../views/home.php';
    }

    /**
     * Full Services Directory with search & category filtering
     */
    public function index(): void
    {
        $category = $_GET['category'] ?? null;
        $search = $_GET['q'] ?? null;

        $services = $this->serviceModel->getAll([
            'category_slug' => $category,
            'search'        => $search
        ]);

        $pageTitle = "Comprehensive Services Directory | KMFRI";
        require_once __DIR__ . '/../views/services/index.php';
    }

    /**
     * Individual Service Detail Page
     */
    public function show(string $slug): void
    {
        $service = $this->serviceModel->findBySlug($slug);

        if (!$service) {
            http_response_code(404);
            require_once __DIR__ . '/../views/errors/404.php';
            return;
        }

        $pageTitle = $service['title'] . " | KMFRI Enterprise Services";
        require_once __DIR__ . '/../views/services/detail.php';
    }
}
`
  },
  {
    path: 'views/partials/header.php',
    filename: 'header.php',
    language: 'php',
    category: 'views',
    description: 'Header partial matching kmfri.go.ke theme, colors, typography, national ribbon and navigation.',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle ?? 'KMFRI Enterprise Services Hub') ?></title>
    <!-- KMFRI Brand Typography & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/kmfri-services.css">
</head>
<body class="kmfri-subsite">

    <!-- Top Official Government of Kenya Bar -->
    <div class="kmfri-gov-topbar">
        <div class="kmfri-container kmfri-flex-between">
            <div class="kmfri-gov-identity">
                <span class="kmfri-flag-accent"></span>
                <span>Republic of Kenya &bull; Ministry of Mining, Blue Economy and Maritime Affairs</span>
            </div>
            <div class="kmfri-gov-links">
                <a href="https://kmfri.go.ke" class="kmfri-back-link">&larr; Return to Main KMFRI Portal</a>
                <span class="kmfri-divider">|</span>
                <span class="kmfri-hotline">Inquiries: +254 (0) 41 475151</span>
            </div>
        </div>
    </div>

    <!-- Main Navigation Header replicating kmfri.go.ke design language -->
    <header class="kmfri-header">
        <div class="kmfri-container kmfri-flex-between">
            <!-- Brand Wordmark & Official Logo Banner -->
            <a href="/" class="kmfri-brand-lockup">
                <img src="/assets/images/kmfri_logo.png" alt="Kenya Marine &amp; Fisheries Research Institute" class="kmfri-logo-img" style="height: 46px; width: auto;" />
                <div class="kmfri-brand-text" style="border-left: 2px solid #E2E8F0; padding-left: 10px; margin-left: 10px;">
                    <span class="kmfri-brand-name" style="font-size: 10px; color: #F7941D; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">ENTERPRISE PORTAL</span>
                    <span class="kmfri-sub-title" style="font-size: 13px; color: #002B57; font-weight: 700;">Services Hub</span>
                </div>
            </a>

            <!-- Navigation Links -->
            <nav class="kmfri-nav">
                <a href="/" class="<?= ($currentPage ?? '') === 'home' ? 'active' : '' ?>">Home</a>
                <a href="/services" class="<?= ($currentPage ?? '') === 'services' ? 'active' : '' ?>">All Services</a>
                <a href="/stations" class="<?= ($currentPage ?? '') === 'stations' ? 'active' : '' ?>">Research Stations</a>
                <a href="/charter" class="<?= ($currentPage ?? '') === 'charter' ? 'active' : '' ?>">Service Charter</a>
            </nav>

            <!-- Primary Action CTA -->
            <div class="kmfri-header-cta">
                <a href="/inquire" class="kmfri-btn kmfri-btn-gold">Request Quote / Book</a>
            </div>
        </div>
    </header>
`
  },
  {
    path: 'views/services/detail.php',
    filename: 'detail.php',
    language: 'php',
    category: 'views',
    description: 'Dynamic PHP Service Detail Page template rendering turnaround times, pricing tiers, accredited stations, and inquiry modal.',
    content: `<?php require_once __DIR__ . '/../partials/header.php'; ?>

<main class="kmfri-main-content">
    <!-- Breadcrumb Bar -->
    <div class="kmfri-breadcrumb-bar">
        <div class="kmfri-container">
            <nav class="kmfri-breadcrumbs">
                <a href="/">Home</a> <span>/</span>
                <a href="/services">Services Directory</a> <span>/</span>
                <span class="current"><?= htmlspecialchars($service['title']) ?></span>
            </nav>
        </div>
    </div>

    <!-- Service Header Banner -->
    <section class="kmfri-service-hero">
        <div class="kmfri-container kmfri-grid-2col">
            <div class="kmfri-service-intro">
                <div class="kmfri-badge-sector"><?= htmlspecialchars($service['category_name']) ?></div>
                <h1 class="kmfri-page-title"><?= htmlspecialchars($service['title']) ?></h1>
                <p class="kmfri-lead-text"><?= htmlspecialchars($service['short_description']) ?></p>
                
                <div class="kmfri-meta-strip">
                    <div class="kmfri-meta-item">
                        <span class="label">Turnaround Time</span>
                        <span class="val"><?= htmlspecialchars($service['turnaround_time']) ?></span>
                    </div>
                    <div class="kmfri-meta-item">
                        <span class="label">Target Clientele</span>
                        <span class="val"><?= htmlspecialchars($service['remarks']) ?></span>
                    </div>
                    <div class="kmfri-meta-item">
                        <span class="label">Certification</span>
                        <span class="val"><?= htmlspecialchars($service['iso_standard']) ?></span>
                    </div>
                </div>
            </div>

            <div class="kmfri-service-action-box">
                <div class="kmfri-card kmfri-quote-card">
                    <h3>Request Service / Quotation</h3>
                    <p>Obtain an official KMFRI fee estimate and scheduling slot.</p>
                    <a href="/inquire?service=<?= urlencode($service['slug']) ?>" class="kmfri-btn kmfri-btn-primary kmfri-btn-full">
                        Initiate Formal Service Request
                    </a>
                    <div class="kmfri-officer-direct">
                        <strong>Official Contact:</strong><br>
                        <?= htmlspecialchars($service['contact_officer_title']) ?><br>
                        Email: <a href="mailto:<?= htmlspecialchars($service['contact_email']) ?>"><?= htmlspecialchars($service['contact_email']) ?></a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Comprehensive Service Specifications & Tariffs -->
    <section class="kmfri-section">
        <div class="kmfri-container kmfri-grid-3col">
            <div class="kmfri-col-2">
                <h2>Overview &amp; Scientific Scope</h2>
                <div class="kmfri-prose">
                    <p><?= nl2br(htmlspecialchars($service['full_overview'])) ?></p>
                </div>

                <!-- Official Tariffs & Fees Table -->
                <h2 class="kmfri-mt-8">Approved Tariffs &amp; Fee Schedule</h2>
                <table class="kmfri-table">
                    <thead>
                        <tr>
                            <th>Service Category / Test Description</th>
                            <th>Billing Unit</th>
                            <th>Standard Fee (KES)</th>
                            <th>Turnaround Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($service['pricing_tiers'] as $tier): ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($tier['tier_name']) ?></strong></td>
                            <td><?= htmlspecialchars($tier['unit_description']) ?></td>
                            <td class="kmfri-price">KES <?= number_format((float)$tier['cost_kes'], 2) ?></td>
                            <td><?= htmlspecialchars($tier['turnaround_time']) ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <!-- Stations & Accredited Centres -->
            <div class="kmfri-col-1">
                <div class="kmfri-sidebar-box">
                    <h3>Available Research Stations</h3>
                    <p>Delivered across the following KMFRI regional centres:</p>
                    <ul class="kmfri-station-list">
                        <?php foreach ($service['stations'] as $station): ?>
                        <li>
                            <strong><?= htmlspecialchars($station['name']) ?></strong>
                            <span><?= htmlspecialchars($station['location']) ?> (<?= htmlspecialchars($station['county']) ?>)</span>
                        </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            </div>
        </div>
    </section>
</main>

<?php require_once __DIR__ . '/../partials/footer.php'; ?>
`
  },
  {
    path: 'assets/css/kmfri-services.css',
    filename: 'kmfri-services.css',
    language: 'css',
    category: 'config',
    description: 'Visual parity stylesheet matching kmfri.go.ke: Navy palette, gold accents, typography, and responsive grid.',
    content: `/* ==========================================================================
   Kenya Marine and Fisheries Research Institute (KMFRI)
   Enterprise Services Sub-Website Design Language & CSS Tokens
   Replicating kmfri.go.ke styling with 100% visual parity
   ========================================================================== */

:root {
  --kmfri-navy-primary: #003366;     /* Official KMFRI Deep Marine Navy */
  --kmfri-navy-dark: #002244;        /* Dark Navy for header/footer */
  --kmfri-navy-light: #0f4c81;       /* Medium Oceanic Navy */
  --kmfri-gold-accent: #c58b1a;      /* National Republic of Kenya Gold */
  --kmfri-gold-hover: #b37b12;
  --kmfri-teal-subtle: #008080;      /* Coastal Marine Teal */
  --kmfri-bg-canvas: #f8fafc;        /* 60% Neutral canvas */
  --kmfri-surface: #ffffff;          /* 30% Structural cards */
  --kmfri-text-main: #0f172a;        /* High-contrast typography */
  --kmfri-text-muted: #475569;
  --kmfri-border-subtle: #e2e8f0;
  --kmfri-font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}

body.kmfri-subsite {
  margin: 0;
  font-family: var(--kmfri-font-family);
  background-color: var(--kmfri-bg-canvas);
  color: var(--kmfri-text-main);
  line-height: 1.6;
}

/* 1. Official Government Top Bar */
.kmfri-gov-topbar {
  background-color: #111827;
  color: #94a3b8;
  font-size: 0.75rem;
  padding: 0.35rem 0;
  border-bottom: 2px solid var(--kmfri-gold-accent);
}

.kmfri-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.kmfri-flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 2. Main Institutional Header */
.kmfri-header {
  background-color: var(--kmfri-surface);
  border-bottom: 1px solid var(--kmfri-border-subtle);
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}

.kmfri-brand-lockup {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  text-decoration: none;
}

.kmfri-brand-name {
  display: block;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--kmfri-navy-primary);
  letter-spacing: -0.01em;
}

.kmfri-sub-title {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--kmfri-gold-accent);
  letter-spacing: 0.05em;
}

.kmfri-nav {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

.kmfri-nav a {
  color: var(--kmfri-navy-primary);
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: color 0.15s ease;
}

.kmfri-nav a:hover,
.kmfri-nav a.active {
  color: var(--kmfri-gold-accent);
  border-bottom: 2px solid var(--kmfri-gold-accent);
  padding-bottom: 0.25rem;
}

/* 3. Button Styles */
.kmfri-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.25rem;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
}

.kmfri-btn-gold {
  background-color: var(--kmfri-gold-accent);
  color: #ffffff;
}

.kmfri-btn-gold:hover {
  background-color: var(--kmfri-gold-hover);
}

.kmfri-btn-primary {
  background-color: var(--kmfri-navy-primary);
  color: #ffffff;
}

.kmfri-btn-primary:hover {
  background-color: var(--kmfri-navy-dark);
}

/* 4. Table Styles */
.kmfri-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: #ffffff;
  border: 1px solid var(--kmfri-border-subtle);
  border-radius: 6px;
  overflow: hidden;
}

.kmfri-table th {
  background-color: var(--kmfri-navy-primary);
  color: #ffffff;
  text-align: left;
  padding: 0.85rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.kmfri-table td {
  padding: 0.85rem 1rem;
  font-size: 0.85rem;
  border-bottom: 1px solid var(--kmfri-border-subtle);
}

.kmfri-table tr:hover {
  background-color: #f8fafc;
}

.kmfri-price {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: var(--kmfri-navy-primary);
}
`
  },
  {
    path: 'integration/hero-embed-snippet.html',
    filename: 'hero-embed-snippet.html',
    language: 'html',
    category: 'integration',
    description: 'Code snippet ready to be inserted into the hero section of the main kmfri.go.ke website to link seamlessly to the sub-site.',
    content: `<!-- ==========================================================================
     KMFRI Sub-Website Integration Snippet
     Insert this block into the Hero Section of the main website (kmfri.go.ke)
     ========================================================================== -->

<!-- 1. Hero Tab Trigger -->
<li class="kmfri-hero-tab-item">
    <a href="https://services.kmfri.go.ke" class="kmfri-hero-tab-link active" id="tab-enterprise-services" role="tab" aria-selected="true">
        <span class="kmfri-tab-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
        </span>
        <span class="kmfri-tab-title">Commercial &amp; Enterprise Services</span>
        <span class="kmfri-tab-badge">Central Hub</span>
    </a>
</li>

<!-- 2. Hero Interactive Content Panel -->
<div class="kmfri-hero-panel active" id="panel-enterprise-services">
    <div class="kmfri-hero-content-wrapper">
        <div class="kmfri-hero-badge">Official Institute Services Catalogue</div>
        <h2 class="kmfri-hero-headline">KMFRI Commercial &amp; Enterprise Services Hub</h2>
        <p class="kmfri-hero-description">
            Access certified laboratory testing, fisheries stock consultancy, certified fingerling seed multiplication, RV Mtafiti research vessel charter, and oceanographic data products through our centralized portal.
        </p>
        <div class="kmfri-hero-action-group">
            <a href="https://services.kmfri.go.ke/services" class="kmfri-btn kmfri-btn-primary">
                Browse 10 Core Services &rarr;
            </a>
            <a href="https://services.kmfri.go.ke/inquire" class="kmfri-btn kmfri-btn-outline">
                Request Official Quotation
            </a>
        </div>
    </div>
</div>

<!-- 3. Accompanying Integration Stylesheet -->
<style>
.kmfri-hero-tab-item {
    display: inline-block;
    list-style: none;
}
.kmfri-hero-tab-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(0, 51, 102, 0.9);
    color: #ffffff;
    text-decoration: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    border-top: 3px solid #c58b1a;
    transition: all 0.2s ease;
}
.kmfri-hero-tab-link:hover,
.kmfri-hero-tab-link.active {
    background: #003366;
    color: #f59e0b;
}
.kmfri-tab-badge {
    background: #c58b1a;
    color: #ffffff;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: uppercase;
}
</style>
`
  },
  {
    path: 'index.php',
    filename: 'index.php',
    language: 'php',
    category: 'core',
    description: 'Front Controller bootstrap file dispatching all clean URL HTTP requests.',
    content: `<?php
/**
 * Kenya Marine and Fisheries Research Institute (KMFRI)
 * Enterprise Services Sub-Website - Main Entry Point
 */

declare(strict_types=1);

// Autoload dependencies and classes
spl_autoload_register(function ($class) {
    $prefix = 'KMFRI\\\\';
    $baseDir = __DIR__ . '/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\\\', '/', $relativeClass) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});

use KMFRI\\Core\\Router;
use KMFRI\\Controllers\\ServiceController;
use KMFRI\\Controllers\\InquiryController;

$router = new Router();

// Define Clean URL Routes
$router->get('/', [ServiceController::class, 'home']);
$router->get('/services', [ServiceController::class, 'index']);
$router->get('/services/{slug}', [ServiceController::class, 'show']);
$router->get('/inquire', [InquiryController::class, 'create']);
$router->post('/inquire', [InquiryController::class, 'store']);
$router->get('/inquire/confirmation/{reference}', [InquiryController::class, 'confirmation']);

// Dispatch Incoming Request
$router->dispatch();
`
  },
  {
    path: '.htaccess',
    filename: '.htaccess',
    language: 'apache',
    category: 'config',
    description: 'Apache rewrite rules directing all sub-site traffic through the index.php front controller.',
    content: `# KMFRI Enterprise Services Sub-Website URL Rewrite Rules
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Pass all requests not matching real files or folders to index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [L,QSA]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
`
  }
];
