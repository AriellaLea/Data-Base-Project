-- ===============================================================
-- פונקציה 2 - החזרת Ref Cursor עבור דוח הזמנות מספק (Get_Supplier_Order_Report.sql)
-- פרויקט: StyleFlow Marketing Hub + Clothing Store System
-- ===============================================================

CREATE OR REPLACE FUNCTION fn_get_supplier_order_report(
    p_supplier_id INT,
    p_cursor_name REFCURSOR
)
RETURNS REFCURSOR AS $$
DECLARE
    v_supplier_exists BOOLEAN;
BEGIN
    -- 1. בדיקת קיום הספק במערכת למניעת החזרת מצביע ריק לשיירה שלא קיימת
    SELECT EXISTS(
        SELECT 1 FROM suppliers WHERE s_id = p_supplier_id
    ) INTO v_supplier_exists;
    
    IF NOT v_supplier_exists THEN
        RAISE EXCEPTION 'Supplier with ID % does not exist in the database.', p_supplier_id
            USING ERRCODE = 'P0002'; -- No data found custom error
    END IF;

    -- 2. פתיחה וקישור של ה-Ref Cursor לשאילתת הזמנות מורכבת ורשותית
    -- השאילתה שואבת את ההזמנות, פריטי ההזמנות, מחירי העלות וכמויות הפריטים של הספק הנתון
    OPEN p_cursor_name FOR
        SELECT 
            so.order_id,
            so.order_date,
            so.order_status,
            so.total_amount,
            oi.item_id,
            oi.unit_cost,
            oi.quantity,
            pv.v_size,
            pv.v_color,
            p.product_name AS p_name,
            p.product_brand AS p_brand
        FROM stock_orders so
        LEFT JOIN order_items oi ON so.order_id = oi.order_id
        LEFT JOIN products_variants pv ON oi.v_id = pv.v_id
        LEFT JOIN products p ON pv.p_id = p.product_id
        WHERE so.s_id = p_supplier_id
        ORDER BY so.order_date DESC, so.order_id ASC;

    -- החזרת ה-Ref Cursor שמולא בקוד הלקוח
    RETURN p_cursor_name;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'An error occurred inside fn_get_supplier_order_report: % - %', SQLSTATE, SQLERRM;
        RAISE; -- זריקה מחדש של השגיאה לצד הלקוח
END;
$$ LANGUAGE plpgsql;
