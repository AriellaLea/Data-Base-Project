-- ===============================================================
-- StyleFlow Marketing Hub - Drop Tables Script
-- ===============================================================

-- Drop Junction Tables first (due to Foreign Key constraints)
DROP TABLE IF EXISTS campaign_branches;
DROP TABLE IF EXISTS campaign_customers;
DROP TABLE IF EXISTS promotion_products;

-- Drop Tables with Foreign Keys
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS advertising_platforms;
DROP TABLE IF EXISTS advertising_campaigns;
DROP TABLE IF EXISTS marketing_management;

-- Drop Lookup Tables
DROP TABLE IF EXISTS strategy_types;
DROP TABLE IF EXISTS platform_categories;
DROP TABLE IF EXISTS campaign_status;
DROP TABLE IF EXISTS loyalty_levels;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS cities;
