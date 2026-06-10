-- ===============================================================
-- StyleFlow Marketing Hub & Clothing Store System - Full Backup (Stage D)
-- פרויקט ממוזג: StyleFlow_Marketing_Store_Backup4
-- כולל: סכמות, נתונים, מבטים, פונקציות, פרוצדורות, טריגרים ולוגים
-- ===============================================================

-- ---------------------------------------------------------------
-- 1. DROP EXISTING OBJECTS (Clean Environment)
-- ---------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_enforce_campaign_budget_policy ON advertising_campaigns;
DROP TRIGGER IF EXISTS trg_log_stock_movement ON store_product_variants;

DROP FUNCTION IF EXISTS fn_trg_enforce_campaign_budget_policy();
DROP FUNCTION IF EXISTS fn_trg_log_stock_movement();
DROP FUNCTION IF EXISTS fn_get_supplier_order_report(INT, REFCURSOR);
DROP FUNCTION IF EXISTS fn_calculate_campaign_efficiency(INT);

DROP PROCEDURE IF EXISTS sp_adjust_campaign_budgets(INT, INT);
DROP PROCEDURE IF EXISTS sp_process_warehouse_restock(INT, INT, INT);

DROP VIEW IF EXISTS View_Promo_Stock_Readiness;
DROP VIEW IF EXISTS View_Warehouse_Category_Inventory;
DROP VIEW IF EXISTS View_Vendor_Marketing_Performance;

DROP TABLE IF EXISTS campaign_budget_violations_log CASCADE;
DROP TABLE IF EXISTS store_stock_audit_log CASCADE;
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


-- ---------------------------------------------------------------
-- 2. CREATE TABLE HOUSES (Core & Integrated Schema)
-- ---------------------------------------------------------------

-- א. טבלאות תומכות / לוקאפ
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

-- ב. טבלאות המערכת החדשה (בושלו בשלב ג)
CREATE TABLE store_category (
    c_id numeric(5,0) PRIMARY KEY,
    c_name character varying(50) NOT NULL
);

CREATE TABLE store_suppliers (
    s_id numeric(5,0) PRIMARY KEY,
    s_name character varying(50) NOT NULL,
    s_address character varying(100),
    s_email character varying(50) CHECK (s_email LIKE '%@%'),
    s_phone character varying(15)
);

CREATE TABLE store_warehouses (
    w_id numeric(5,0) PRIMARY KEY,
    capacity numeric(15,0) CHECK (capacity >= 0),
    w_location character varying(100),
    w_phone character varying(15),
    manager_name character varying(50)
);

CREATE TABLE store_products (
    p_id numeric(5,0) PRIMARY KEY,
    p_name character varying(50) NOT NULL,
    p_brand character varying(50),
    p_price numeric(10,2) NOT NULL CHECK (p_price > 0),
    c_id numeric(5,0),
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- עמודה משלב ד'
    FOREIGN KEY (c_id) REFERENCES store_category(c_id) ON DELETE SET NULL
);

CREATE TABLE store_product_variants (
    v_id numeric(10,0) PRIMARY KEY,
    v_size character varying(10),
    v_color character varying(50),
    quantity_on_hand numeric(5,0) CHECK (quantity_on_hand >= 0),
    p_id numeric(5,0),
    w_id numeric(5,0),
    FOREIGN KEY (p_id) REFERENCES store_products(p_id) ON DELETE CASCADE,
    FOREIGN KEY (w_id) REFERENCES store_warehouses(w_id)
);

CREATE TABLE store_stock_orders (
    order_id numeric(5,0) PRIMARY KEY,
    order_date date NOT NULL,
    order_status character varying(50) DEFAULT 'Pending',
    total_amount numeric(10,2) DEFAULT 0,
    s_id numeric(5,0),
    FOREIGN KEY (s_id) REFERENCES store_suppliers(s_id)
);

CREATE TABLE store_order_items (
    item_id numeric(10,0) PRIMARY KEY,
    unit_cost numeric(10,2) NOT NULL,
    quantity numeric(5,0) NOT NULL,
    order_id numeric(5,0),
    v_id numeric(10,0),
    FOREIGN KEY (order_id) REFERENCES store_stock_orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (v_id) REFERENCES store_product_variants(v_id)
);

-- ג. טבלאות ניהול שיווק וקמפיינים
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
    supplier_id numeric(5,0), -- עמודת האינטגרציה משלב ג'
    campaign_efficiency_score NUMERIC(5,2) DEFAULT 0.00, -- עמודה משלב ד'
    CONSTRAINT chk_campaign_dates CHECK (end_date > start_date),
    FOREIGN KEY (director_id) REFERENCES marketing_management(director_id),
    FOREIGN KEY (status_id) REFERENCES campaign_status(status_id),
    FOREIGN KEY (supplier_id) REFERENCES store_suppliers(s_id)
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
    product_variant_id numeric(10,0), -- עמודת האינטגרציה משלב ג'
    CONSTRAINT chk_promo_dates CHECK (valid_to > valid_from),
    FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(campaign_id),
    FOREIGN KEY (product_variant_id) REFERENCES store_product_variants(v_id)
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

-- ד. טבלאות קשר (Junction Tables)
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

-- ה. טבלאות מעקב ובקרה (חדשות משלב ד')
CREATE TABLE store_stock_audit_log (
    log_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    v_id numeric(10,0) NOT NULL,
    old_quantity numeric(5,0),
    new_quantity numeric(5,0),
    change_date timestamp DEFAULT CURRENT_TIMESTAMP,
    action_taken varchar(100) NOT NULL
);

CREATE TABLE campaign_budget_violations_log (
    violation_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id INT NOT NULL,
    attempted_budget INT NOT NULL,
    max_allowed_budget NUMERIC(15,2) NOT NULL,
    violation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_alert VARCHAR(255) NOT NULL
);


-- ---------------------------------------------------------------
-- 3. INTERFACE VIEWS (מבטים מותאמים)
-- ---------------------------------------------------------------
CREATE VIEW View_Vendor_Marketing_Performance AS
SELECT 
    ac.campaign_name, 
    ac.budget, 
    ss.s_name AS sponsor_vendor, 
    ac.start_date, 
    ac.end_date, 
    (SELECT SUM(audience_reach) FROM advertising_platforms ap WHERE ap.campaign_id = ac.campaign_id) AS total_reach
FROM advertising_campaigns ac 
JOIN store_suppliers ss ON ac.supplier_id = ss.s_id;

CREATE VIEW View_Warehouse_Category_Inventory AS
SELECT 
    sw.w_location, 
    sc.c_name AS category, 
    COUNT(spv.v_id) AS variety_count, 
    SUM(spv.quantity_on_hand) AS total_items_in_stock
FROM store_warehouses sw 
JOIN store_product_variants spv ON sw.w_id = spv.w_id 
JOIN store_products sp ON spv.p_id = sp.p_id 
JOIN store_category sc ON sp.c_id = sc.c_id
GROUP BY sw.w_location, sc.c_name;

CREATE VIEW View_Promo_Stock_Readiness AS
SELECT 
    p.promo_name, 
    p.discount_percent, 
    sp.p_name AS product_name, 
    spv.v_size, 
    spv.v_color, 
    spv.quantity_on_hand AS available_stock, 
    CASE 
        WHEN spv.quantity_on_hand > 40 THEN 'High Readiness' 
        WHEN spv.quantity_on_hand BETWEEN 10 AND 40 THEN 'Medium Readiness' 
        ELSE 'Low Readiness - Order Now' 
    END AS stock_status
FROM promotions p 
JOIN store_product_variants spv ON p.product_variant_id = spv.v_id 
JOIN store_products sp ON spv.p_id = sp.p_id;


-- ---------------------------------------------------------------
-- 4. INSERT SAMPLE RECORDS (הזנת נתונים לנחיתה חלקה)
-- ---------------------------------------------------------------
INSERT INTO cities VALUES (1, 'Tel Aviv'), (2, 'Jerusalem');
INSERT INTO categories VALUES (1, 'Electronics'), (2, 'Fashion');
INSERT INTO loyalty_levels VALUES (1, 'Bronze'), (2, 'Silver'), (3, 'Gold');
INSERT INTO campaign_status VALUES (1, 'Draft'), (2, 'Active'), (3, 'Completed');
INSERT INTO strategy_types VALUES (1, 'Aggressive'), (2, 'Conservative');

-- הזנת נתוני החנות
INSERT INTO store_category VALUES (10, 'Winter Collection'), (20, 'Sportswear');
INSERT INTO store_suppliers VALUES 
(50, 'Fashion Group Inc', 'New York', 'contact@fashion.com', '123-456'), 
(60, 'Sporty Ltd', 'Berlin', 'sales@sporty.com', '987-654');
INSERT INTO store_warehouses VALUES (100, 5000, 'Main Port DC', '555-010', 'John Wick');

INSERT INTO store_products VALUES 
(501, 'Thermal Parka', 'Zara', 450.00, 10), 
(502, 'Running Shoes', 'Nike', 300.00, 20);

INSERT INTO store_product_variants VALUES 
(1001, 'XL', 'Navy Blue', 50, 501, 100), 
(1002, 'M', 'Black', 25, 502, 100),
(1003, 'S', 'White', 5, 502, 100); -- וריאציה עם מלאי נמוך לבדיקת הטריגר והרענון

-- הזנת הנהלת המרקטינג
INSERT INTO marketing_management VALUES (1, 'Sarah Levy', 'Tel Aviv', 10, 1000000.00, 1);

-- הזנת קמפיינים, פלטפורמות ומבצעים
INSERT INTO advertising_campaigns (campaign_id, director_id, campaign_name, start_date, end_date, budget, status_id, supplier_id) 
VALUES (1, 1, 'Winter Clothing Sale', '2026-11-01', '2027-02-28', 120000, 2, 50);

INSERT INTO advertising_platforms VALUES 
(1, 1, 'Facebook Ads', 2, 15000, 60000),
(2, 1, 'Google Marketing', 2, 8000, 45000);

-- המבצע מצנח ישירות לווריאציה 1001 שהרכבנו
INSERT INTO promotions (promo_id, campaign_id, promo_name, discount_percent, valid_from, valid_to, product_variant_id) 
VALUES (1, 1, 'Big Winter Discount', 20, '2026-12-01', '2027-01-15', 1001);

-- הוספת הזמנת רכש לדוגמה
INSERT INTO store_stock_orders VALUES (1001, '2026-05-15', 'Pending', 4000.00, 50);
INSERT INTO store_order_items VALUES (5001, 270.00, 15, 1001, 1001);


-- ---------------------------------------------------------------
-- 5. COMPILING PL/PGSQL CODE (פונקציות, פרוצדורות וטריגרים)
-- ---------------------------------------------------------------

-- ===============================================================
-- פונקציה 1 - fn_calculate_campaign_efficiency
-- ===============================================================
CREATE OR REPLACE FUNCTION fn_calculate_campaign_efficiency(p_campaign_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_campaign_budget NUMERIC(15,2);
    v_total_platform_cost NUMERIC(15,2) := 0;
    v_total_investment NUMERIC(15,2);
    v_total_promoted_stock NUMERIC(15,0) := 0;
    v_weighted_discount NUMERIC(15,2) := 0;
    v_efficiency_score NUMERIC(5,2) := 0.00;
    r_promo RECORD;
    cur_promotions CURSOR FOR 
        SELECT p.promo_id, p.discount_percent, p.product_variant_id, pv.quantity_on_hand
        FROM promotions p
        LEFT JOIN store_product_variants pv ON p.product_variant_id = pv.v_id
        WHERE p.campaign_id = p_campaign_id;
BEGIN
    SELECT budget INTO v_campaign_budget
    FROM advertising_campaigns
    WHERE campaign_id = p_campaign_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campaign with ID % does not exist.', p_campaign_id;
    END IF;
    
    SELECT COALESCE(SUM(price), 0) INTO v_total_platform_cost
    FROM advertising_platforms
    WHERE campaign_id = p_campaign_id;
    
    v_total_investment := COALESCE(v_campaign_budget, 0) + v_total_platform_cost;
    
    IF v_total_investment = 0 THEN
        RAISE EXCEPTION 'Division by zero: Total investment is 0 for campaign %.', p_campaign_id;
    END IF;

    OPEN cur_promotions;
    LOOP
        FETCH cur_promotions INTO r_promo;
        EXIT WHEN NOT FOUND;
        
        IF r_promo.quantity_on_hand IS NOT NULL AND r_promo.quantity_on_hand > 0 THEN
            v_total_promoted_stock := v_total_promoted_stock + r_promo.quantity_on_hand;
            v_weighted_discount := v_weighted_discount + (r_promo.quantity_on_hand * (r_promo.discount_percent / 100.0));
        END IF;
    END LOOP;
    CLOSE cur_promotions;

    IF v_total_promoted_stock > 0 THEN
        v_efficiency_score := LEAST(((v_weighted_discount * 1000.0) / v_total_investment), 999.99);
    ELSE
        v_efficiency_score := 0.00;
    END IF;
    
    UPDATE advertising_campaigns
    SET campaign_efficiency_score = v_efficiency_score
    WHERE campaign_id = p_campaign_id;
    
    RETURN v_efficiency_score;
EXCEPTION
    WHEN division_by_zero THEN
        RETURN 0.00;
    WHEN OTHERS THEN
        RETURN -1.00;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================
-- פונקציה 2 - fn_get_supplier_order_report (החזרת Ref Cursor)
-- ===============================================================
CREATE OR REPLACE FUNCTION fn_get_supplier_order_report(
    p_supplier_id INT,
    p_cursor_name REFCURSOR
)
RETURNS REFCURSOR AS $$
DECLARE
    v_supplier_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM store_suppliers WHERE s_id = p_supplier_id) INTO v_supplier_exists;
    
    IF NOT v_supplier_exists THEN
        RAISE EXCEPTION 'Supplier with ID % not found.', p_supplier_id;
    END IF;

    OPEN p_cursor_name FOR
        SELECT 
            so.order_id, so.order_date, so.order_status, so.total_amount,
            oi.item_id, oi.unit_cost, oi.quantity,
            pv.v_size, pv.v_color, p.p_name, p.p_brand
        FROM store_stock_orders so
        LEFT JOIN store_order_items oi ON so.order_id = oi.order_id
        LEFT JOIN store_product_variants pv ON oi.v_id = pv.v_id
        LEFT JOIN store_products p ON pv.p_id = p.p_id
        WHERE so.s_id = p_supplier_id
        ORDER BY so.order_date DESC;

    RETURN p_cursor_name;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================
-- פרוצדורה 1 - sp_process_warehouse_restock
-- ===============================================================
CREATE OR REPLACE PROCEDURE sp_process_warehouse_restock(
    p_warehouse_id INT,
    p_min_stock INT,
    p_order_quantity INT
) AS $$
DECLARE
    v_new_order_id numeric(5,0);
    v_new_item_id numeric(10,0);
    v_supplier_id numeric(5,0) := 50;
    v_unit_cost numeric(10,2);
    v_order_total numeric(10,2) := 0;
    v_items_restocked_count INT := 0;
    v_warehouse_exists INT;
    r_variant RECORD;
    cur_low_stock CURSOR FOR
        SELECT pv.v_id, pv.quantity_on_hand, p.p_price, p.p_brand
        FROM store_product_variants pv
        JOIN store_products p ON pv.p_id = p.p_id
        WHERE pv.w_id = p_warehouse_id AND pv.quantity_on_hand < p_min_stock;
BEGIN
    SELECT COUNT(*) INTO v_warehouse_exists FROM store_warehouses WHERE w_id = p_warehouse_id;
    IF v_warehouse_exists = 0 THEN
        RAISE EXCEPTION 'Warehouse % not found.', p_warehouse_id;
    END IF;
    
    OPEN cur_low_stock;
    LOOP
        FETCH cur_low_stock INTO r_variant;
        EXIT WHEN NOT FOUND;
        
        v_unit_cost := r_variant.p_price * 0.60;
        
        IF v_items_restocked_count = 0 THEN
            SELECT COALESCE(MAX(order_id), 1000) + 1 INTO v_new_order_id FROM store_stock_orders;
            INSERT INTO store_stock_orders (order_id, order_date, order_status, total_amount, s_id)
            VALUES (v_new_order_id, CURRENT_DATE, 'Restock Draft', 0, v_supplier_id);
        END IF;
        
        SELECT COALESCE(MAX(item_id), 5000) + 1 INTO v_new_item_id FROM store_order_items;
        
        INSERT INTO store_order_items (item_id, unit_cost, quantity, order_id, v_id)
        VALUES (v_new_item_id, v_unit_cost, p_order_quantity, v_new_order_id, r_variant.v_id);
        
        v_order_total := v_order_total + (v_unit_cost * p_order_quantity);
        v_items_restocked_count := v_items_restocked_count + 1;
        
        UPDATE store_product_variants
        SET quantity_on_hand = quantity_on_hand + p_order_quantity
        WHERE v_id = r_variant.v_id;
    END LOOP;
    CLOSE cur_low_stock;
    
    IF v_items_restocked_count > 0 THEN
        UPDATE store_stock_orders
        SET total_amount = v_order_total, order_status = 'Approved & Inbound'
        WHERE order_id = v_new_order_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================
-- פרוצדורה 2 - sp_adjust_campaign_budgets
-- ===============================================================
CREATE OR REPLACE PROCEDURE sp_adjust_campaign_budgets(
    p_director_id INT,
    p_max_budget_allowed INT
) AS $$
DECLARE
    v_director_exists INT;
    r_camp RECORD;
    v_platform_costs_sum INT;
    v_suggested_new_budget INT;
BEGIN
    SELECT COUNT(*) INTO v_director_exists FROM marketing_management WHERE director_id = p_director_id;
    IF v_director_exists = 0 THEN
        RAISE EXCEPTION 'Director % not found in Marketing.', p_director_id;
    END IF;

    FOR r_camp IN 
        SELECT campaign_id, budget
        FROM advertising_campaigns
        WHERE director_id = p_director_id
    LOOP
        SELECT COALESCE(SUM(price), 0) INTO v_platform_costs_sum
        FROM advertising_platforms
        WHERE campaign_id = r_camp.campaign_id;
        
        IF v_platform_costs_sum >= (r_camp.budget * 0.80) THEN
            v_suggested_new_budget := GREATEST(r_camp.budget * 1.25, v_platform_costs_sum + 5000);
            
            IF v_suggested_new_budget > p_max_budget_allowed THEN
                v_suggested_new_budget := p_max_budget_allowed;
            END IF;
            
            UPDATE advertising_campaigns
            SET budget = v_suggested_new_budget
            WHERE campaign_id = r_camp.campaign_id;
            
        ELSIF v_platform_costs_sum < (r_camp.budget * 0.40) AND r_camp.budget > 10000 THEN
            v_suggested_new_budget := r_camp.budget * 0.90;
            
            UPDATE advertising_campaigns
            SET budget = v_suggested_new_budget
            WHERE campaign_id = r_camp.campaign_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================
-- טריגר 1 - trg_log_stock_movement (UPDATE)
-- ===============================================================
CREATE OR REPLACE FUNCTION fn_trg_log_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_diff NUMERIC;
    v_action VARCHAR(100);
BEGIN
    IF OLD.quantity_on_hand IS DISTINCT FROM NEW.quantity_on_hand THEN
        v_diff := NEW.quantity_on_hand - OLD.quantity_on_hand;
        
        IF v_diff > 0 THEN
            v_action := 'STOCK_INCREASE: Received ' || v_diff || ' units.';
        ELSE
            v_action := 'STOCK_DECREASE: Distributed ' || ABS(v_diff) || ' units.';
        END IF;

        IF NEW.quantity_on_hand < 10 THEN
            v_action := v_action || ' WARNING: Stock dropped below limit (' || NEW.quantity_on_hand || ').';
        END IF;

        INSERT INTO store_stock_audit_log (v_id, old_quantity, new_quantity, action_taken)
        VALUES (NEW.v_id, OLD.quantity_on_hand, NEW.quantity_on_hand, v_action);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_stock_movement
AFTER UPDATE ON store_product_variants
FOR EACH ROW
EXECUTE FUNCTION fn_trg_log_stock_movement();

-- ===============================================================
-- טריגר 2 - trg_enforce_campaign_budget_policy (INSERT / UPDATE)
-- ===============================================================
CREATE OR REPLACE FUNCTION fn_trg_enforce_campaign_budget_policy()
RETURNS TRIGGER AS $$
DECLARE
    v_director_annual_budget NUMERIC(15,2);
    v_max_campaign_limit NUMERIC(15,2);
    v_violation_msg VARCHAR(255);
BEGIN
    IF NEW.budget < 0 THEN
        RAISE EXCEPTION 'Campaign budget cannot be negative (%).', NEW.budget;
    END IF;

    SELECT annual_budget INTO v_director_annual_budget
    FROM marketing_management
    WHERE director_id = NEW.director_id;

    IF v_director_annual_budget IS NOT NULL THEN
        v_max_campaign_limit := v_director_annual_budget * 0.50;
        
        IF NEW.budget > v_max_campaign_limit THEN
            v_violation_msg := 'POL-VIOLATION: Budget ' || NEW.budget || ' violates the 50% cap of director budget (' || v_max_campaign_limit || ').';
            
            INSERT INTO campaign_budget_violations_log (campaign_id, attempted_budget, max_allowed_budget, user_alert)
            VALUES (NEW.campaign_id, NEW.budget, v_max_campaign_limit, v_violation_msg);
            
            NEW.budget := CAST(v_max_campaign_limit AS INT);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_campaign_budget_policy
BEFORE INSERT OR UPDATE ON advertising_campaigns
FOR EACH ROW
EXECUTE FUNCTION fn_trg_enforce_campaign_budget_policy();
