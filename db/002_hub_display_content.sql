-- ====================================================================
-- KMFRI Enterprise Services Hub — display content supplement
-- Runs after 001_kmfri_services_db.sql. Adds the fields the public site
-- renders that the core schema does not carry (station descriptions,
-- service photographs). Content is taken from the existing hub copy.
-- ====================================================================

USE kmfri_services_db;

ALTER TABLE research_stations
  ADD COLUMN description TEXT NULL AFTER county;

UPDATE research_stations SET description = CASE code
  WHEN 'KMFRI-MBA' THEN 'The National Headquarters overseeing all marine science, oceanography, blue economy advisory, and flagship research vessels including RV Mtafiti.'
  WHEN 'KMFRI-KSM' THEN 'Premier scientific hub for Lake Victoria research, post-harvest fish processing, water quality monitoring, and freshwater fisheries management.'
  WHEN 'KMFRI-NVS' THEN 'Conducts research on Lake Naivasha, Lake Nakuru, and Rift Valley water bodies focusing on ecology, pesticide impacts, and warm water fish hatcheries.'
  WHEN 'KMFRI-SHM' THEN 'Kenya’s flagship marine aquaculture and mariculture facility dedicated to crab seed multiplication, milkfish farming, seaweed development, and sea cucumber culture.'
  WHEN 'KMFRI-KGT' THEN 'Specialized national broodstock multiplication and training station for high-growth Nile Tilapia and African Catfish fingerlings serving Western Kenya.'
  WHEN 'KMFRI-SNG' THEN 'Research facility focusing on indigenous riverine fish breeding (Labeo victorianus, Schilbe mystus) and river catchment water monitoring.'
  WHEN 'KMFRI-BRG' THEN 'Monitors Lake Baringo and Lake Bogoria aquatic dynamics, siltation patterns, biodiversity, and post-harvest preservation in ASAL environments.'
  WHEN 'KMFRI-TRK' THEN 'Dedicated to studying the unique ecology and potential of the world’s largest permanent desert lake, supporting local indigenous fisherfolk.'
  ELSE description END;

UPDATE services SET featured_image = CASE slug
  WHEN 'laboratory-analytical-services' THEN '/images/analytical-lab.webp'
  WHEN 'technical-consultancy-services' THEN '/images/coral-reef-survey.webp'
  WHEN 'fish-and-aquaculture-services' THEN '/images/aquaculture-hatchery.webp'
  WHEN 'scientific-data-and-information-services' THEN '/images/vessel-aerial.webp'
  WHEN 'research-vessel-hire-services' THEN '/images/vessel-port.webp'
  WHEN 'fish-products-and-value-addition-services' THEN '/images/aquaculture-hatchery.webp'
  WHEN 'educational-visits' THEN '/images/coral-reef-survey.webp'
  WHEN 'training-and-capacity-building' THEN '/images/analytical-lab.webp'
  WHEN 'conference-and-meeting-facilities' THEN '/images/vessel-aerial.webp'
  WHEN 'student-attachment-and-internship-services' THEN '/images/analytical-lab.webp'
  ELSE featured_image END
WHERE featured_image IS NULL;
