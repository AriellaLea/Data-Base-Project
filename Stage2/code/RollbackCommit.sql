-- ===============================================================
-- Phase B: Rollback and Commit Examples
-- StyleFlow Marketing Hub
-- ===============================================================

-- 1. ROLLBACK EXAMPLE
-- Scenario: Trying to delete all campaigns, then realizing it was a mistake.
-- We must follow the order of dependencies: 
-- promotion_products -> promotions -> advertising_campaigns
-- advertising_platforms -> advertising_campaigns
-- campaign_customers -> advertising_campaigns
-- campaign_branches -> advertising_campaigns

BEGIN;

-- [Screenshot 1]
SELECT COUNT(*) as campaigns_before FROM advertising_campaigns;

-- Deleting all dependencies to allow the campaign deletion
DELETE FROM promotion_products;
DELETE FROM promotions;
DELETE FROM advertising_platforms;
DELETE FROM campaign_customers;
DELETE FROM campaign_branches;

-- Now deleting the campaigns
DELETE FROM advertising_campaigns;

-- [Screenshot 2]
SELECT COUNT(*) as campaigns_during_transaction FROM advertising_campaigns;

-- Realize it was a mistake!
ROLLBACK;

-- [Screenshot 3]
SELECT COUNT(*) as campaigns_restored_after_rollback FROM advertising_campaigns;


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
