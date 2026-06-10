-- ===============================================================
-- פרוצדורה 1 - חידוש מלאי אוטומטי במחסן (Process_Warehouse_Restock.sql)
-- פרויקט: StyleFlow Marketing Hub + Clothing Store System
-- ===============================================================

CREATE OR REPLACE PROCEDURE sp_process_warehouse_restock(
    p_warehouse_id INT,
    p_min_stock INT,
    p_order_quantity INT
) AS $$
DECLARE
    -- משתנים ליצירת הזמנות ספק
    v_new_order_id numeric(5,0);
    v_new_item_id numeric(10,0);
    v_supplier_id numeric(5,0);
    v_unit_cost numeric(10,2);
    v_order_total numeric(10,2) := 0;
    
    -- דגל ומונים למעקב
    v_items_restocked_count INT := 0;
    v_warehouse_exists INT;
    
    -- רשומה לשימוש ב-Cursor
    r_variant RECORD;
    
    -- הגדרת Cursor מפורש (Explicit Cursor) לזיהוי פריטים הדורשים חידוש מלאי במחסן המסוים
    cur_low_stock CURSOR FOR
        SELECT pv.v_id, pv.quantity_on_hand, p.price AS p_price, p.product_brand AS p_brand, p.product_id AS p_id
        FROM products_variants pv
        JOIN products p ON pv.p_id = p.product_id
        WHERE pv.w_id = p_warehouse_id AND pv.quantity_on_hand < p_min_stock;
        
BEGIN
    -- 1. וולידציה - בדיקה שהמחסן באמת קיים במערכת
    SELECT COUNT(*) INTO v_warehouse_exists 
    FROM warehouses 
    WHERE w_id = p_warehouse_id;
    
    IF v_warehouse_exists = 0 THEN
        RAISE EXCEPTION 'Warehouse with ID % was not found.', p_warehouse_id
            USING ERRCODE = 'P0002';
    END IF;
    
    -- קביעת ספק ברירת מחדל (אם אין ספק ספציפי נעבוד עם ספק 50)
    v_supplier_id := 50;
 
    -- 2. פתיחת ה-Cursor וסריקת הפריטים עם חוסר במלאי
    OPEN cur_low_stock;
    LOOP
        FETCH cur_low_stock INTO r_variant;
        EXIT WHEN NOT FOUND;
        
        -- קביעת מחיר המלאי מהספק (למשל, 60% ממחיר המכירה בחנות כעלות הקנייה מהספק)
        v_unit_cost := r_variant.p_price * 0.60;
        
        -- יצירת הזמנת ספק חדשה במידה והיא טרם הוקמה בלולאה זו
        IF v_items_restocked_count = 0 THEN
            -- גזירת ה-ID הבא להזמנה בצורה בטוחה
            SELECT COALESCE(MAX(order_id), 1000) + 1 INTO v_new_order_id 
            FROM stock_orders;
            
            -- יצירת כותרת הזמנה
            INSERT INTO stock_orders (order_id, order_date, order_status, total_amount, s_id)
            VALUES (v_new_order_id, CURRENT_DATE, 'Restock Draft', 0, v_supplier_id);
            
            RAISE NOTICE 'Created new Stock Order with ID % for Supplier %', v_new_order_id, v_supplier_id;
        END IF;
        
        -- גזירת ה-ID הבא לפריט ההזמנה באופן בטוח
        SELECT COALESCE(MAX(item_id), 5000) + 1 INTO v_new_item_id 
        FROM order_items;
        
        -- הוספת פריט להזמנת הרכש
        INSERT INTO order_items (item_id, unit_cost, quantity, order_id, v_id)
        VALUES (v_new_item_id, v_unit_cost, p_order_quantity, v_new_order_id, r_variant.v_id);
        
        -- צבירת סך ההזמנה
        v_order_total := v_order_total + (v_unit_cost * p_order_quantity);
        v_items_restocked_count := v_items_restocked_count + 1;
        
        -- עדכון כמות המלאי בפועל במחסן (יגרור הפעלה של ה-Trigger ורישום בלוג!)
        UPDATE products_variants
        SET quantity_on_hand = quantity_on_hand + p_order_quantity
        WHERE v_id = r_variant.v_id;
        
        RAISE NOTICE 'Item Restocked: Variant ID %, Brand %, Size increased by % units.', 
            r_variant.v_id, r_variant.p_brand, p_order_quantity;
            
    END LOOP;
    CLOSE cur_low_stock;
    
    -- 3. עדכון סך הכל הכספי בהזמנת הספק שיצרנו
    IF v_items_restocked_count > 0 THEN
        UPDATE stock_orders
        SET total_amount = v_order_total,
            order_status = 'Approved & Inbound'
        WHERE order_id = v_new_order_id;
        
        RAISE NOTICE 'Completed restocking process. Total: % items added across % variants. Order Total Amount: %',
            (v_items_restocked_count * p_order_quantity), v_items_restocked_count, v_order_total;
    ELSE
        RAISE NOTICE 'No restock required. All variants in Warehouse % are above the % threshold.', 
            p_warehouse_id, p_min_stock;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Transaction rolled back! Error inside Restock Procedure: % - %', SQLSTATE, SQLERRM;
        RAISE; -- ביטול הפעולה במקרה של תקלה כלשהי לשמירה על עקביות הנתונים
END;
$$ LANGUAGE plpgsql;
