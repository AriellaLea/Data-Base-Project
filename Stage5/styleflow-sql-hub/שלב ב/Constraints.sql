-- ===============================================================
-- Phase B: Constraints
-- StyleFlow Marketing Hub
-- ===============================================================

-- 1. Ensure employee count in marketing management is never negative.
ALTER TABLE marketing_management
ADD CONSTRAINT chk_employee_positive CHECK (employee_count >= 0);

-- 2. Ensure customer email follows a basic format (contains @).
ALTER TABLE customers
ADD CONSTRAINT chk_customer_email_format CHECK (email LIKE '%@%');

-- 3. Ensure discount percentage is between 0 and 100.
ALTER TABLE promotions
ADD CONSTRAINT chk_discount_range CHECK (discount_percent BETWEEN 0 AND 100);

-- Test scripts for constraints (uncomment to test - should fail)
-- ---------------------------------------------------------------
-- INSERT INTO marketing_management (director_id, director_name, head_office, employee_count, annual_budget, strategy_type_id)
-- VALUES (999, 'Test Failure', 'Nowhere', -5, 1000, 1); -- Should fail

-- INSERT INTO customers (customer_id, name, email, date_of_birth, loyalty_level_id, points_balance)
-- VALUES (999, 'Bad Email', 'bad-email-no-at', '1990-01-01', 1, 0); -- Should fail

-- INSERT INTO promotions (promo_id, campaign_id, promo_name, discount_percent, valid_from, valid_to)
-- VALUES (999, 1, 'Bad Discount', 150, '2025-01-01', '2025-01-02'); -- Should fail
