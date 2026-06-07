-- ===============================================================
-- שלב ד' - פקודות Alter Table ושינויי מבנה (AlterTable.sql)
-- פרויקט: StyleFlow Marketing Hub + Clothing Store System
-- ===============================================================

-- 1. יצירת טבלת מעקב לתיעוד תנועות מלאי ומחסנים (משמשת את טריגר 1)
CREATE TABLE store_stock_audit_log (
    log_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    v_id numeric(10,0) NOT NULL,
    old_quantity numeric(5,0),
    new_quantity numeric(5,0),
    change_date timestamp DEFAULT CURRENT_TIMESTAMP,
    action_taken varchar(255) NOT NULL
);

-- 2. יצירת טבלת מעקב אחרי חריגות תקציב של קמפיינים שיווקיים (משמשת את טריגר 2)
CREATE TABLE campaign_budget_violations_log (
    violation_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id INT NOT NULL,
    attempted_budget INT NOT NULL,
    max_allowed_budget NUMERIC(15,2) NOT NULL,
    violation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_alert VARCHAR(255) NOT NULL
);

-- 3. הוספת עמודת דירוג יעילות לקמפיינים (לעדכון מבוסס פונקציה חיצונית)
ALTER TABLE advertising_campaigns
ADD COLUMN campaign_efficiency_score NUMERIC(5,2) DEFAULT 0.00;

-- 4. הוספת עמודת תאריך עדכון אחרון למוצרים
ALTER TABLE products
ADD COLUMN last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
