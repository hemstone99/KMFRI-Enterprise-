-- =====================================================================
-- 003: Inquiry workflow for the administration dashboard
--
-- The hub's application account has SELECT + EXECUTE only. Status changes
-- go through this procedure (definer's rights), which enforces the allowed
-- transitions and writes the audit row in the same transaction.
--
--   pending ─► under_review ─► quote_issued ─► invoice_generated ─► paid ─► fulfilled
--      └──────────┴───────────────┴──────────────────┴──► cancelled
-- =====================================================================

DROP PROCEDURE IF EXISTS sp_update_inquiry_status;

DELIMITER //

CREATE PROCEDURE sp_update_inquiry_status(
  IN p_inquiry_id INT UNSIGNED,
  IN p_new_status VARCHAR(30),
  IN p_changed_by VARCHAR(100),
  IN p_remarks TEXT
)
BEGIN
  DECLARE v_current VARCHAR(30);
  DECLARE v_allowed TINYINT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT status INTO v_current FROM service_inquiries WHERE id = p_inquiry_id FOR UPDATE;

  IF v_current IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inquiry not found';
  END IF;

  SET v_allowed = CASE
    WHEN p_new_status = 'cancelled' THEN v_current IN ('pending', 'under_review', 'quote_issued', 'invoice_generated')
    WHEN v_current = 'pending' THEN p_new_status = 'under_review'
    WHEN v_current = 'under_review' THEN p_new_status = 'quote_issued'
    WHEN v_current = 'quote_issued' THEN p_new_status = 'invoice_generated'
    WHEN v_current = 'invoice_generated' THEN p_new_status = 'paid'
    WHEN v_current = 'paid' THEN p_new_status = 'fulfilled'
    ELSE 0
  END;

  IF v_allowed = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Status transition not allowed';
  END IF;

  UPDATE service_inquiries SET status = p_new_status WHERE id = p_inquiry_id;

  INSERT INTO inquiry_status_history (inquiry_id, previous_status, new_status, changed_by, remarks)
  VALUES (p_inquiry_id, v_current, p_new_status, LEFT(p_changed_by, 100), NULLIF(p_remarks, ''));

  COMMIT;
END //

DELIMITER ;
