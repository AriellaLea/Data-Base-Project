-- ===============================================================
-- שלב ג - אינטגרציה (Integrate.sql)
-- פרויקט: StyleFlow Marketing Hub + Clothing Store System
-- ===============================================================

-- 1. יצירת הטבלאות של האגף החדש (עם תחילית store_ למניעת התנגשויות)
-- ---------------------------------------------------------------

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

-- 2. פקודות אינטגרציה (Linking the two systems)
-- ---------------------------------------------------------------

-- א. הקשר בין קמפיינים לספקים (מימון קמפיינים)
ALTER TABLE advertising_campaigns 
ADD COLUMN supplier_id numeric(5,0);

ALTER TABLE advertising_campaigns 
ADD CONSTRAINT fk_campaign_supplier 
FOREIGN KEY (supplier_id) REFERENCES store_suppliers(s_id);

-- ב. הקשר בין מבצעים למוצרים ספציפיים מהמחסן
ALTER TABLE promotions 
ADD COLUMN product_variant_id numeric(10,0);

ALTER TABLE promotions 
ADD CONSTRAINT fk_promo_variant 
FOREIGN KEY (product_variant_id) REFERENCES store_product_variants(v_id);

-- 3. הזנת נתונים ראשוניים לאגף החדש (דוגמאות)
-- ---------------------------------------------------------------

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
(1002, 'M', 'Black', 25, 502, 100);

-- עדכון נתונים קיימים לקישור
UPDATE advertising_campaigns SET supplier_id = 50 WHERE campaign_id = 1;
UPDATE promotions SET product_variant_id = 1001 WHERE promo_id = 1;
