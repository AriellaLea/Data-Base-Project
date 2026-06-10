-- ===============================================================
-- Phase B: Performance Indices
-- StyleFlow Marketing Hub
-- ===============================================================

-- 1. Index on customer points balance
-- Motivation: Frequent queries filter and sort by loyalty points.
CREATE INDEX idx_customer_points ON customers(points_balance);

-- 2. Index on campaign dates
-- Motivation: Campaigns are often queried by active date range (start/end).
CREATE INDEX idx_campaign_dates ON advertising_campaigns(start_date, end_date);

-- 3. Index on product category and price
-- Motivation: Searching for top products by price within a category is a common query.
CREATE INDEX idx_product_cat_price ON products(category_id, price);

-- Testing motivation (Simulated Results Explanation):
/*
Before adding idx_customer_points:
Executing: SELECT name FROM customers WHERE points_balance > 5000;
Runtime: ~15ms (requires Seq Scan on entire table)

After adding idx_customer_points:
Executing: SELECT name FROM customers WHERE points_balance > 5000;
Runtime: ~2ms (uses Index Scan / Bitmap Heap Scan)
Explanation: The index allows the database to jump directly to the rows matching 
the criteria without reading every page of the customers table.
*/
