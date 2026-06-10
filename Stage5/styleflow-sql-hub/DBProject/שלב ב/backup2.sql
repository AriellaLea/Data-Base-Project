-- ===============================================================
-- StyleFlow Marketing Hub - Full Database Backup (Phase B)
-- Includes: Schema, Normalized Enums, Initial Data, 
--           Step B Constraints and Indices.
-- ===============================================================

-- 1. DROP EVERYTHING
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

-- 2. CREATE LOOKUP TABLES
CREATE TABLE cities (city_id INT PRIMARY KEY, city_name VARCHAR(255) NOT NULL);
CREATE TABLE categories (category_id INT PRIMARY KEY, category_name VARCHAR(255) NOT NULL);
CREATE TABLE loyalty_levels (loyalty_id INT PRIMARY KEY, level_name VARCHAR(255) NOT NULL);
CREATE TABLE campaign_status (status_id INT PRIMARY KEY, status_name VARCHAR(255) NOT NULL);
CREATE TABLE platform_categories (category_id INT PRIMARY KEY, category_name VARCHAR(255) NOT NULL);
CREATE TABLE strategy_types (strategy_id INT PRIMARY KEY, strategy_name VARCHAR(255) NOT NULL);

-- 3. CREATE MAIN TABLES
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

CREATE TABLE products (
  product_id INT PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  price INT CHECK (price > 0),
  stock_quantity INT CHECK (stock_quantity >= 0),
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE promotions (
  promo_id INT PRIMARY KEY,
  campaign_id INT NOT NULL,
  promo_name VARCHAR(255) NOT NULL,
  discount_percent INT CHECK (discount_percent BETWEEN 0 AND 100),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  CONSTRAINT chk_promo_dates CHECK (valid_to > valid_from),
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(campaign_id)
);

CREATE TABLE branches (
  branch_id INT PRIMARY KEY,
  branch_name VARCHAR(255) NOT NULL,
  city_id INT NOT NULL,
  manager_name VARCHAR(255) NOT NULL,
  opening_hours VARCHAR(255) NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(city_id)
);

CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  loyalty_level_id INT NOT NULL,
  points_balance INT DEFAULT 0 CHECK (points_balance >= 0),
  FOREIGN KEY (loyalty_level_id) REFERENCES loyalty_levels(loyalty_id)
);

-- 4. JUNCTION TABLES
CREATE TABLE promotion_products (
  promo_id INT, product_id INT,
  PRIMARY KEY (promo_id, product_id),
  FOREIGN KEY (promo_id) REFERENCES promotions(promo_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE campaign_customers (
  campaign_id INT, customer_id INT,
  PRIMARY KEY (campaign_id, customer_id),
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(campaign_id),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE campaign_branches (
  campaign_id INT, branch_id INT,
  PRIMARY KEY (campaign_id, branch_id),
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(campaign_id),
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);

-- 5. STEP B CONSTRAINTS (ALTER TABLE)
ALTER TABLE customers ADD CONSTRAINT chk_customer_email_format CHECK (email LIKE '%@%');

-- 6. STEP B INDICES
CREATE INDEX idx_customer_points ON customers(points_balance);
CREATE INDEX idx_campaign_dates ON advertising_campaigns(start_date, end_date);
CREATE INDEX idx_product_cat_price ON products(category_id, price);

-- 7. INSERT SAMPLE DATA
INSERT INTO cities (city_id, city_name) VALUES (1, 'Tel Aviv'), (2, 'Jerusalem'), (3, 'Haifa'), (4, 'Eilat');
INSERT INTO categories (category_id, category_name) VALUES (1, 'Electronics'), (2, 'Fashion'), (3, 'Home'), (4, 'Beauty');
INSERT INTO loyalty_levels (loyalty_id, level_name) VALUES (1, 'Bronze'), (2, 'Silver'), (3, 'Gold'), (4, 'Platinum');
INSERT INTO campaign_status (status_id, status_name) VALUES (1, 'Draft'), (2, 'Active'), (3, 'Completed'), (4, 'Cancelled');
INSERT INTO platform_categories (category_id, category_name) VALUES (1, 'Social Media'), (2, 'Search'), (3, 'Billboard');
INSERT INTO strategy_types (strategy_id, strategy_name) VALUES (1, 'Aggressive'), (2, 'Conservative'), (3, 'Viral');

-- Generate 500 Branches
INSERT INTO branches (branch_id, branch_name, city_id, manager_name, opening_hours)
SELECT
    row_number() OVER () as branch_id,
    'Branch_' || row_number() OVER (),
    city_id,
    'Manager_' || (ARRAY['Dupont', 'Durand', 'Martin', 'Levy', 'Cohen'])[floor(random() * 5 + 1)],
    '09:00 - 18:00'
FROM (
    SELECT city_id FROM cities ORDER BY random()
) c
CROSS JOIN generate_series(1, 10) 
LIMIT 500;

INSERT INTO marketing_management (director_id, director_name, head_office, employee_count, annual_budget, strategy_type_id) 
VALUES (1, 'Sarah Levy', 'Tel Aviv', 10, 1000000, 1), (2, 'David Cohen', 'Haifa', 5, 500000, 2);

INSERT INTO advertising_campaigns (campaign_id, director_id, campaign_name, start_date, end_date, budget, status_id)
VALUES (1, 1, 'Summer Sale 2025', '2025-06-01', '2025-08-31', 50000, 2),
       (2, 2, 'Winter Clearance', '2025-12-01', '2026-02-28', 30000, 1);

INSERT INTO advertising_platforms (platform_id, campaign_id, platform_name, category_id, price, audience_reach)
VALUES (1, 1, 'Facebook Ads', 1, 10000, 50000), (2, 1, 'Google Search', 1, 15000, 30000);

INSERT INTO products (product_id, product_name, category_id, price, stock_quantity)
VALUES (1, 'iPhone 15', 1, 4000, 50), (2, 'Leather Jacket', 2, 800, 100), (3, 'Coffee Machine', 3, 1200, 20);

INSERT INTO promotions (promo_id, campaign_id, promo_name, discount_percent, valid_from, valid_to)
VALUES (1, 1, 'Tech Discount', 10, '2025-06-01', '2025-07-01');

INSERT INTO branches (branch_id, branch_name, city_id, manager_name, opening_hours)
VALUES (1, 'Tel Aviv Main', 1, 'Yossi G.', '09:00-22:00'), (2, 'Haifa Port', 3, 'Rina S.', '10:00-20:00');

INSERT INTO customers (customer_id, name, email, date_of_birth, loyalty_level_id, points_balance)
VALUES (1, 'Alice Smith', 'alice@gmail.com', '1995-05-15', 3, 1500),
       (2, 'Bob Levy', 'bob@yahoo.com', '1988-11-20', 1, 200),
       (3, 'Charlie Brown', 'char@gmail.com', '2000-01-01', 2, 100);

INSERT INTO campaign_customers (campaign_id, customer_id) VALUES (1, 1), (1, 2);
INSERT INTO campaign_branches (campaign_id, branch_id) VALUES (1, 1), (1, 2);
INSERT INTO promotion_products (promo_id, product_id) VALUES (1, 1);
