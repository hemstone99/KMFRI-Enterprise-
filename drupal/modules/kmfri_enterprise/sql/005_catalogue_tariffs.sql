-- ====================================================================
-- 005: Tariffs and charter from the Service Catalogue
--
-- Runs after 004_service_catalogue.sql. The register's published tariffs
-- become the quotable pricing tiers of each portfolio, so the quotation
-- form, the dashboard and the Tariffs & Charter page all use the amounts
-- shown in the catalogue. Safe to re-run.
--
--   1. Every priced catalogue service is a pricing tier (keyed by register_no).
--   2. Portfolio rates the catalogue supersedes are retired (kept for history).
--   3. Seed inquiries that used a retired rate move to the catalogue tariff.
--   4. Charter fee summaries are recomputed from the catalogue.
--   5. v_catalogue_tariffs: the complete public tariff schedule.
-- ====================================================================

USE kmfri_services_db;

-- 1. Publish the catalogue tariffs. Laboratory tests carry no unit in the register: "per test".
INSERT INTO pricing_tiers (service_id, register_no, tier_name, unit_description, cost_kes, cost_usd, turnaround_time, vat_applicable, is_active, display_order)
SELECT ci.service_id, ci.register_no, LEFT(ci.name, 200), COALESCE(ci.fee_unit, 'per test'), ci.fee_kes, NULL,
       LEFT(s.turnaround_time, 100), 0, 1, ci.display_order
  FROM catalogue_items ci
  JOIN services s ON s.id = ci.service_id
 WHERE ci.fee_kes IS NOT NULL
ON DUPLICATE KEY UPDATE
  service_id = VALUES(service_id),
  tier_name = VALUES(tier_name),
  unit_description = VALUES(unit_description),
  cost_kes = VALUES(cost_kes),
  turnaround_time = VALUES(turnaround_time),
  is_active = 1,
  display_order = VALUES(display_order);

-- Tariffs whose register row was removed or is no longer priced.
UPDATE pricing_tiers pt
  LEFT JOIN catalogue_items ci ON ci.register_no = pt.register_no
   SET pt.is_active = 0
 WHERE pt.register_no IS NOT NULL
   AND (ci.register_no IS NULL OR ci.fee_kes IS NULL);

-- 2. Retire the portfolio rates of services the catalogue prices.
UPDATE pricing_tiers
   SET is_active = 0
 WHERE register_no IS NULL
   AND service_id IN (SELECT DISTINCT service_id FROM catalogue_items WHERE fee_kes IS NOT NULL AND service_id IS NOT NULL);

-- 3. Seed inquiries quoted on a retired rate.
UPDATE service_inquiries si
  JOIN pricing_tiers old ON old.id = si.pricing_tier_id AND old.is_active = 0 AND old.register_no IS NULL
  JOIN pricing_tiers pt ON pt.register_no = 124
   SET si.pricing_tier_id = pt.id, si.estimated_quantity = 3, si.estimated_cost_kes = pt.cost_kes * 3
 WHERE si.reference_number = 'KMFRI-SRV-2026-8812';

UPDATE service_inquiries si
  JOIN pricing_tiers old ON old.id = si.pricing_tier_id AND old.is_active = 0 AND old.register_no IS NULL
  JOIN pricing_tiers pt ON pt.register_no = 46
   SET si.pricing_tier_id = pt.id, si.estimated_quantity = 10000, si.estimated_cost_kes = pt.cost_kes * 10000
 WHERE si.reference_number = 'KMFRI-SRV-2026-9041';

-- 4. Charter fee summaries for portfolios with catalogue tariffs.
UPDATE service_charter ch
  JOIN (
    SELECT service_id, MIN(fee_kes) AS lo, MAX(fee_kes) AS hi, COUNT(fee_kes) AS n, SUM(fee_note = 'Free') AS free
      FROM catalogue_items
     WHERE service_id IS NOT NULL
     GROUP BY service_id
    HAVING COUNT(fee_kes) > 0
  ) t ON t.service_id = ch.service_id
   SET ch.official_fee_summary = LEFT(CONCAT(
         'Ksh ', FORMAT(t.lo, 0), IF(t.hi > t.lo, CONCAT(' – ', FORMAT(t.hi, 0)), ''),
         ' · ', t.n, ' published tariffs', IF(t.free > 0, ', some free', '')
       ), 150);

-- 5. Complete public tariff schedule: every catalogue service with its tariff and quotable tier.
DROP VIEW IF EXISTS v_catalogue_tariffs;
CREATE VIEW v_catalogue_tariffs AS
SELECT
  ci.register_no,
  d.title AS division,
  n.title AS service_group,
  ci.name AS service,
  ci.fee_kes,
  CASE WHEN ci.fee_kes IS NULL THEN NULL ELSE COALESCE(ci.fee_unit, 'per test') END AS fee_unit,
  ci.fee_note,
  ci.availability,
  s.code AS portfolio_code,
  s.title AS portfolio,
  pt.id AS pricing_tier_id,
  CONCAT('/enterprise/catalogue/', n.url_path) AS web_path,
  ci.display_order
FROM catalogue_items ci
JOIN catalogue_nodes n ON n.id = ci.node_id
JOIN catalogue_nodes d ON d.id = n.division_id
LEFT JOIN services s ON s.id = ci.service_id
LEFT JOIN pricing_tiers pt ON pt.register_no = ci.register_no AND pt.is_active = 1
ORDER BY ci.display_order;
