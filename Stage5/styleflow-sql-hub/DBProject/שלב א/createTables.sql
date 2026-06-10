-- ===============================================================
-- StyleFlow Marketing Hub - SQL Schema (3NF Compliant)
-- ===============================================================

/*
DICTIONARY & EXPLANATIONS:

1. cities: Stores unique city names where branches are located.
   - city_id: Primary Key (INT)
   - city_name: Name of the city (VARCHAR)

2. categories: General product and platform categories.
   - category_id: Primary Key (INT)
   - category_name: Name of the category (VARCHAR)

3. loyalty_levels: Defines customer loyalty tiers.
   - loyalty_id: Primary Key (INT)
   - level_name: Tier name (e.g., Bronze, Silver, Gold) (VARCHAR)

4. campaign_status: Possible statuses for a marketing campaign.
   - status_id: Primary Key (INT)
   - status_name: Status name (e.g., Draft, Active, Completed) (VARCHAR)

5. platform_categories: Specific categories for advertising platforms.
   - category_id: Primary Key (INT)
   - category_name: Category name (VARCHAR)

6. strategy_types: Different marketing strategy approaches.
   - strategy_id: Primary Key (INT)
   - strategy_name: Strategy name (VARCHAR)

7. marketing_management: High-level management and budget info.
   - director_id: Unique ID for the director (INT)
   - director_name: Name of the director (VARCHAR)
   - head_office: Location of the main office (VARCHAR)
   - employee_count: Number of employees (INT, >= 0)
   - annual_budget: Total annual budget (DECIMAL, > 0)
   - strategy_type_id: Link to strategy_types (FK)

8. advertising_campaigns: Marketing campaigns details.
   - campaign_id: Unique campaign ID (INT)
   - director_id: Managing director (FK)
   - campaign_name: Name of the campaign (VARCHAR)
   - start_date: Launch date (DATE)
   - end_date: Conclusion date (DATE, > start_date)
   - budget: Campaign specific budget (INT, >= 0)
   - status_id: Current status (FK)

9. advertising_platforms: Channels where ads are displayed.
   - platform_id: Unique platform ID (INT)
   - campaign_id: Linked campaign (FK)
   - platform_name: Name (e.g., Facebook, Google Ads) (VARCHAR)
   - category_id: Platform category (FK)
   - price: Cost of using the platform (INT, >= 0)
   - audience_reach: Estimated reach (INT, >= 0)

10. products: Inventory items.
    - product_id: Unique product ID (INT)
    - product_name: Name of the product (VARCHAR)
    - category_id: Product category (FK)
    - price: Unit price (INT, > 0)
    - stock_quantity: Available stock (INT, >= 0)

11. promotions: Special offers linked to campaigns.
    - promo_id: Unique promotion ID (INT)
    - campaign_id: Linked campaign (FK)
    - promo_name: Name of the offer (VARCHAR)
    - discount_percent: Percentage off (INT, 0-100)
    - valid_from: Start date (DATE)
    - valid_to: End date (DATE, > valid_from)

12. branches: Physical store locations.
    - branch_id: Unique branch ID (INT)
    - branch_name: Name of the branch (VARCHAR)
    - city_id: City location (FK)
    - manager_name: Branch manager (VARCHAR)
    - opening_hours: Operating schedule (VARCHAR)

13. customers: Customer database.
    - customer_id: Unique customer ID (INT)
    - name: Full name (VARCHAR)
    - email: Unique email address (VARCHAR)
    - date_of_birth: Birth date (DATE)
    - loyalty_level_id: Loyalty tier (FK)
    - points_balance: Current loyalty points (INT, >= 0)

14. promotion_products (Junction): Links promotions to specific products.
15. campaign_customers (Junction): Links campaigns to targeted customers.
16. campaign_branches (Junction): Links campaigns to participating branches.
*/

-- Lookup Tables
CREATE TABLE cities (
  city_id INT PRIMARY KEY,
  city_name VARCHAR(255) NOT NULL
);

CREATE TABLE categories (
  category_id INT PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL
);

CREATE TABLE loyalty_levels (
  loyalty_id INT PRIMARY KEY,
  level_name VARCHAR(255) NOT NULL
);

CREATE TABLE campaign_status (
  status_id INT PRIMARY KEY,
  status_name VARCHAR(255) NOT NULL
);

CREATE TABLE platform_categories (
  category_id INT PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL
);

CREATE TABLE strategy_types (
  strategy_id INT PRIMARY KEY,
  strategy_name VARCHAR(255) NOT NULL
);

-- Main Entities
CREATE TABLE marketing_management (
  director_id INT PRIMARY KEY NOT NULL,
  director_name VARCHAR(255) NOT NULL,
  head_office VARCHAR(255) NOT NULL,
  employee_count INT CHECK (employee_count >= 0),
  annual_budget NUMERIC(15,2) CHECK (annual_budget > 0),
  strategy_type_id INT NOT NULL,
  FOREIGN KEY (strategy_type_id) REFERENCES strategy_types(strategy_id)
);

CREATE TABLE advertising_campaigns (
  campaign_id INT PRIMARY KEY NOT NULL,
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
  platform_id INT PRIMARY KEY NOT NULL,
  campaign_id INT NOT NULL,
  platform_name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  price INT CHECK (price >= 0),
  audience_reach INT CHECK (audience_reach >= 0),
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(campaign_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE products (
  product_id INT PRIMARY KEY NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  price INT CHECK (price > 0),
  stock_quantity INT CHECK (stock_quantity >= 0),
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE promotions (
  promo_id INT PRIMARY KEY NOT NULL,
  campaign_id INT NOT NULL,
  promo_name VARCHAR(255) NOT NULL,
  discount_percent INT CHECK (discount_percent BETWEEN 0 AND 100),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  CONSTRAINT chk_promo_dates CHECK (valid_to > valid_from),
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(campaign_id)
);

CREATE TABLE branches (
  branch_id INT PRIMARY KEY NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  city_id INT NOT NULL,
  manager_name VARCHAR(255) NOT NULL,
  opening_hours VARCHAR(255) NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(city_id)
);

CREATE TABLE customers (
  customer_id INT PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  loyalty_level_id INT NOT NULL,
  points_balance INT DEFAULT 0 CHECK (points_balance >= 0),
  FOREIGN KEY (loyalty_level_id) REFERENCES loyalty_levels(loyalty_id)
);

-- Junction Tables
CREATE TABLE promotion_products (
  promo_id INT,
  product_id INT,
  PRIMARY KEY (promo_id, product_id),
  FOREIGN KEY (promo_id) REFERENCES promotions(promo_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE campaign_customers (
  campaign_id INT,
  customer_id INT,
  PRIMARY KEY (campaign_id, customer_id),
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(campaign_id),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE campaign_branches (
  campaign_id INT,
  branch_id INT,
  PRIMARY KEY (campaign_id, branch_id),
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(campaign_id),
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);
