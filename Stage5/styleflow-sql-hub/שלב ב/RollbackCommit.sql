-- ===============================================================
-- Phase B: Rollback and Commit Examples
-- StyleFlow Marketing Hub
-- ===============================================================

-- 1. ROLLBACK EXAMPLE
-- Scenario: Trying to delete all campaigns, then realizing it was a mistake.
BEGIN;

-- Check state before delete
SELECT COUNT(*) as campaigns_before FROM advertising_campaigns;

DELETE FROM advertising_campaigns;

-- Check state after delete (should be 0 in current transaction)
SELECT COUNT(*) as campaigns_after_delete FROM advertising_campaigns;

-- Realize error and rollback
ROLLBACK;

-- Check state after rollback (should be back to original)
SELECT COUNT(*) as campaigns_after_rollback FROM advertising_campaigns;


-- 2. COMMIT EXAMPLE
-- Scenario: Updating loyalty points for specific customers and finalizing the change.
BEGIN;

-- Check points before update
SELECT customer_id, name, points_balance FROM customers LIMIT 5;

UPDATE customers SET points_balance = points_balance + 100 WHERE loyalty_level_id = 1;

-- Check state in transaction
SELECT customer_id, name, points_balance FROM customers WHERE loyalty_level_id = 1 LIMIT 5;

-- Finalize changes
COMMIT;

-- Check state after commit
SELECT customer_id, name, points_balance FROM customers WHERE loyalty_level_id = 1 LIMIT 5;
