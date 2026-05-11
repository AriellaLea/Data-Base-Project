-- ===============================================================
-- Phase B: Additional Constraints
-- StyleFlow Marketing Hub
-- ===============================================================

-- 1. Ensure customer loyalty points are never negative
ALTER TABLE customers
ADD CONSTRAINT chk_points_balance_positive 
CHECK (points_balance >= 0);

-- TEST FAIL :
-- INSERT INTO customers (customer_id, name, email, points_balance, loyalty_level_id) 
-- VALUES (9999, 'Test User', 'test@example.com', -10, 1);


-- 2. Ensure product prices are always greater than zero
ALTER TABLE products
ADD CONSTRAINT chk_product_price_positive 
CHECK (price > 0);

-- TEST FAIL :
-- INSERT INTO products (product_id, product_name, price, stock_quantity, category_id) 
-- VALUES (8888, 'Broken Product', -5.00, 10, 1);


-- 3. Ensure marketing management has at least one employee
ALTER TABLE marketing_management
ADD CONSTRAINT chk_management_employee_min 
CHECK (employee_count > 0);

-- TEST FAIL :
-- INSERT INTO marketing_management (director_id, strategy_type_id, employee_count) 
-- VALUES (7777, 1, 0);
