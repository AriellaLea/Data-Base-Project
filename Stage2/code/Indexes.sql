-- ===============================================================
-- Phase B: Performance Optimization - Indexes
-- StyleFlow Marketing Hub
-- ===============================================================

-- 1. Index on advertising_campaigns(status_id)
-- Motivation: We frequently filter campaigns by their status (e.g., 'Active', 'Cancelled').
-- Performance Test:
EXPLAIN ANALYZE 
SELECT * FROM advertising_campaigns WHERE status_id = 1;

CREATE INDEX idx_campaign_status ON advertising_campaigns(status_id);

EXPLAIN ANALYZE 
SELECT * FROM advertising_campaigns WHERE status_id = 1;


-- 2. Index on customers(loyalty_level_id)
-- Motivation: Common filtering and joining for loyalty-based marketing.
-- Performance Test:
EXPLAIN ANALYZE 
SELECT * FROM customers WHERE loyalty_level_id = 2;

CREATE INDEX idx_customer_loyalty ON customers(loyalty_level_id);

EXPLAIN ANALYZE 
SELECT * FROM customers WHERE loyalty_level_id = 2;


-- 3. Index on products(category_id)
-- Motivation: Frequent queries to list products within a specific category.
-- Performance Test:
EXPLAIN ANALYZE 
SELECT * FROM products WHERE category_id = 3;

CREATE INDEX idx_product_category ON products(category_id);

EXPLAIN ANALYZE 
SELECT * FROM products WHERE category_id = 3;
