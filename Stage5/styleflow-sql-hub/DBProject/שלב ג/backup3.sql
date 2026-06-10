-- ===============================================================
-- StyleFlow Marketing Hub (Integrated) - Full Backup (Stage C)
-- Includes: Original Schema, Integrated Tables, Data, and Views.
-- ===============================================================

-- 1. DROP EVERYTHING (Clean start)
DROP VIEW IF EXISTS View_Promo_Stock_Readiness;
DROP VIEW IF EXISTS View_Warehouse_Category_Inventory;
DROP VIEW IF EXISTS View_Vendor_Marketing_Performance;

DROP TABLE IF EXISTS store_order_items CASCADE;
DROP TABLE IF EXISTS store_stock_orders CASCADE;
DROP TABLE IF EXISTS store_product_variants CASCADE;
DROP TABLE IF EXISTS store_products CASCADE;
DROP TABLE IF EXISTS store_warehouses CASCADE;
DROP TABLE IF EXISTS store_suppliers CASCADE;
DROP TABLE IF EXISTS store_category CASCADE;

DROP TABLE IF EXISTS campaign_branches CASCADE;
DROP TABLE IF EXISTS campaign_customers CASCADE;
DROP TABLE IF EXISTS promotion_products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS advertising_platforms CASCADE;
DROP TABLE IF EXISTS advertising_campaigns CASCADE;
DROP TABLE IF EXISTS marketing_management CASCADE;
DROP TABLE IF EXISTS strategy_types CASCADE;
DROP TABLE IF EXISTS platform_categories CASCADE;
DROP TABLE IF EXISTS campaign_status CASCADE;
DROP TABLE IF EXISTS loyalty_levels CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- 2. CREATE ORIGINAL SCHEME (Marketing Hub)
CREATE TABLE cities (city_id INT PRIMARY KEY, city_name VARCHAR(255) NOT NULL);
CREATE TABLE categories (category_id INT PRIMARY KEY, category_name VARCHAR(255) NOT NULL);
CREATE TABLE loyalty_levels (loyalty_id INT PRIMARY KEY, level_name VARCHAR(255) NOT NULL);
CREATE TABLE campaign_status (status_id INT PRIMARY KEY, status_name VARCHAR(255) NOT NULL);
CREATE TABLE platform_categories (category_id INT PRIMARY KEY, category_name VARCHAR(255) NOT NULL);
CREATE TABLE strategy_types (strategy_id INT PRIMARY KEY, strategy_name VARCHAR(255) NOT NULL);

CREATE TABLE marketing_management (
  director_id INT PRIMARY KEY,
  director_name VARCHAR(255) NOT NULL,
  head_office VARCHAR(255) NOT NULL,
  employee_count INT CHECK (employee_count >= 0),
  annual_budget NUMERIC(15,2) CHECK (annual_budget > 0),
  strategy_type_id INT NOT NULL,
  FOREIGN KEY (strategy_type_id) REFERENCES strategy_types(strategy_id)
);

CREATE TABLE advertising_campaigns (
  campaign_id INT PRIMARY KEY,
  director_id INT NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget INT CHECK (budget >= 0),
  status_id INT NOT NULL,
  supplier_id NUMERIC(5,0), -- Integration Column
  CONSTRAINT chk_campaign_dates CHECK (end_date > start_date),
  FOREIGN KEY (director_id) REFERENCES marketing_management(director_id),
  FOREIGN KEY (status_id) REFERENCES campaign_status(status_id)
);

CREATE TABLE advertising_platforms (
  platform_id INT PRIMARY KEY,
  campaign_id INT NOT NULL,
  platform_name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  price INT CHECK (price >= 0),
  audience_reach INT CHECK (audience_reach >= 0),
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(campaign_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Store Integrated Tables (New Wing)
CREATE TABLE store_category (c_id numeric(5,0) PRIMARY KEY, c_name character varying(50) NOT NULL);
CREATE TABLE store_suppliers (s_id numeric(5,0) PRIMARY KEY, s_name character varying(50) NOT NULL, s_address character varying(100), s_email character varying(50), s_phone character varying(15));
CREATE TABLE store_warehouses (w_id numeric(5,0) PRIMARY KEY, capacity numeric(15,0), w_location character varying(100), w_phone character varying(15), manager_name character varying(50));
CREATE TABLE store_products (p_id numeric(5,0) PRIMARY KEY, p_name character varying(50) NOT NULL, p_brand character varying(50), p_price numeric(10,2) NOT NULL, c_id numeric(5,0), FOREIGN KEY (c_id) REFERENCES store_category(c_id));
CREATE TABLE store_product_variants (v_id numeric(10,0) PRIMARY KEY, v_size character varying(10), v_color character varying(50), quantity_on_hand numeric(5,0), p_id numeric(5,0), w_id numeric(5,0), FOREIGN KEY (p_id) REFERENCES store_products(p_id), FOREIGN KEY (w_id) REFERENCES store_warehouses(w_id));

CREATE TABLE promotions (
  promo_id INT PRIMARY KEY,
  campaign_id INT NOT NULL,
  promo_name VARCHAR(255) NOT NULL,
  discount_percent INT CHECK (discount_percent BETWEEN 0 AND 100),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  product_variant_id NUMERIC(10,0), -- Integration Column
  CONSTRAINT chk_promo_dates CHECK (valid_to > valid_from),
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(campaign_id),
  FOREIGN KEY (product_variant_id) REFERENCES store_product_variants(v_id)
);

CREATE TABLE branches (branch_id INT PRIMARY KEY, branch_name VARCHAR(255) NOT NULL, city_id INT NOT NULL, manager_name VARCHAR(255) NOT NULL, opening_hours VARCHAR(255) NOT NULL, FOREIGN KEY (city_id) REFERENCES cities(city_id));
CREATE TABLE customers (customer_id INT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, date_of_birth DATE NOT NULL, loyalty_level_id INT NOT NULL, points_balance INT DEFAULT 0, FOREIGN KEY (loyalty_level_id) REFERENCES loyalty_levels(loyalty_id));

-- 3. VIEWS
CREATE VIEW View_Vendor_Marketing_Performance AS
SELECT ac.campaign_name, ac.budget, ss.s_name AS sponsor_vendor, ac.start_date, ac.end_date, (SELECT SUM(audience_reach) FROM advertising_platforms ap WHERE ap.campaign_id = ac.campaign_id) AS total_reach
FROM advertising_campaigns ac JOIN store_suppliers ss ON ac.supplier_id = ss.s_id;

CREATE VIEW View_Warehouse_Category_Inventory AS
SELECT sw.w_location, sc.c_name AS category, COUNT(spv.v_id) AS variety_count, SUM(spv.quantity_on_hand) AS total_items_in_stock
FROM store_warehouses sw JOIN store_product_variants spv ON sw.w_id = spv.w_id JOIN store_products sp ON spv.p_id = sp.p_id JOIN store_category sc ON sp.c_id = sc.c_id
GROUP BY sw.w_location, sc.c_name;

CREATE VIEW View_Promo_Stock_Readiness AS
SELECT p.promo_name, p.discount_percent, sp.p_name AS product_name, spv.v_size, spv.v_color, spv.quantity_on_hand AS available_stock, CASE WHEN spv.quantity_on_hand > 40 THEN 'High Readiness' WHEN spv.quantity_on_hand BETWEEN 10 AND 40 THEN 'Medium Readiness' ELSE 'Low Readiness - Order Now' END AS stock_status
FROM promotions p JOIN store_product_variants spv ON p.product_variant_id = spv.v_id JOIN store_products sp ON spv.p_id = sp.p_id;

-- 4. SAMPLE DATA (Combined)
INSERT INTO cities VALUES (1, 'Tel Aviv'), (2, 'Jerusalem');
INSERT INTO categories VALUES (1, 'Electronics'), (2, 'Fashion');
INSERT INTO loyalty_levels VALUES (1, 'Bronze'), (2, 'Silver');
INSERT INTO campaign_status VALUES (1, 'Draft'), (2, 'Active');
INSERT INTO strategy_types VALUES (1, 'Aggressive'), (2, 'Conservative');

INSERT INTO store_category VALUES (10, 'Winter Collection'), (20, 'Sportswear');
INSERT INTO store_suppliers VALUES (50, 'Fashion Group Inc', 'New York', 'contact@fashion.com', '123-456'), (60, 'Sporty Ltd', 'Berlin', 'sales@sporty.com', '987-654');
INSERT INTO store_warehouses VALUES (100, 5000, 'Main Port DC', '555-010', 'John Wick');
INSERT INTO store_products VALUES (501, 'Thermal Parka', 'Zara', 450.00, 10), (502, 'Running Shoes', 'Nike', 300.00, 20);
INSERT INTO store_product_variants VALUES (1001, 'XL', 'Navy Blue', 50, 501, 100), (1002, 'M', 'Black', 25, 502, 100);

INSERT INTO marketing_management VALUES (1, 'Sarah Levy', 'Tel Aviv', 10, 1000000, 1);
INSERT INTO advertising_campaigns (campaign_id, director_id, campaign_name, start_date, end_date, budget, status_id, supplier_id) VALUES (1, 1, 'Summer Sale 2025', '2025-06-01', '2025-08-31', 50000, 2, 50);
INSERT INTO advertising_platforms VALUES (1, 1, 'Facebook Ads', 2, 10000, 50000);
INSERT INTO promotions (promo_id, campaign_id, promo_name, discount_percent, valid_from, valid_to, product_variant_id) VALUES (1, 1, 'Tech Discount', 10, '2025-06-01', '2025-07-01', 1001);
