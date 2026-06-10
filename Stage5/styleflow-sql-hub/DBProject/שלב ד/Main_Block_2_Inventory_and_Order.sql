-- ===============================================================
-- תוכנית ראשית 2 - חידוש מלאי והפקת דוח רכש מספקים (Main_Block_2_Inventory_and_Order.sql)
-- פרויקט: StyleFlow Marketing Hub + Clothing Store System
-- ===============================================================

DO $$
DECLARE
    -- מזהי בדיקה לפעולת רכש
    v_test_warehouse_id INT := 100;    -- מזהה המחסן הראשי בקובץ האינטגרציה
    v_test_supplier_id INT := 50;      -- מזהה הספק ("Fashion Group Inc")
    
    -- הגדרות ספי רענון מלאי
    v_min_stock_level INT := 100;      -- רמת סף חוסר (כל פריט שיורד מתחת ל-100 נחדש)
    v_restock_qty INT := 50;           -- כמות להשלמה באספקה
    
    -- תשתית Ref Cursor לעבודה עם הפונקציה המורכבת
    v_report_cursor REFCURSOR := 'supplier_report_cursor';
    
    -- רשומת איסוף להקלדת תוצאות הדוח
    r_row RECORD;
    v_row_count INT := 0;
    
BEGIN
    RAISE NOTICE '--- תוכנית ראשית 2: רענון מלאים והפקת דוחות רכש מספקים שונים ---';
    
    -- 1. קריאה לפרוצדורה sp_process_warehouse_restock לבחינת המלאי והזמנת פריטים חסרים
    RAISE NOTICE 'שלב א: בחינת מלאים במחסן % וחידוש אוטומטי עבור אלו שמתחת ל-% יחידות...', 
        v_test_warehouse_id, v_min_stock_level;
        
    CALL sp_process_warehouse_restock(v_test_warehouse_id, v_min_stock_level, v_restock_qty);

    -- 2. הפעלת הפונקציה לקבלת ה-Ref Cursor שמצביע על דוח ההזמנות של הספק
    RAISE NOTICE 'שלב ב: הפקת דוח הזמנות ורכש מספק % באמצעות Ref Cursor...', v_test_supplier_id;
    
    -- ביצוע פנייה לפונקציה לקבלת המצביע (העברת שני הפרמטרים)
    PERFORM fn_get_supplier_order_report(v_test_supplier_id, v_report_cursor);
    
    -- 3. פתיחה וסריקה של השורות מתוך ה-Ref Cursor שהוחזר אלינו
    RAISE NOTICE 'שלב ג: הדפסת תוצאות דוח הרכש של הספק:';
    RAISE NOTICE '---------------------------------------------------------';
    
    LOOP
        FETCH NEXT FROM v_report_cursor INTO r_row;
        EXIT WHEN NOT FOUND;
        
        v_row_count := v_row_count + 1;
        RAISE NOTICE 'סמל פריט: % | מוצר: % (%) | מידה: %, צבע: % | כמות: % יח'' | עלות יחידה: %$ | סטטוס הזמנה %: %',
            r_row.item_id, r_row.p_name, r_row.p_brand, r_row.v_size, r_row.v_color, 
            r_row.quantity, r_row.unit_cost, r_row.order_id, r_row.order_status;
    END LOOP;
    
    -- 4. חובה להקפיד על סגירה נקייה של ה-Ref Cursor
    CLOSE v_report_cursor;
    
    RAISE NOTICE '---------------------------------------------------------';
    RAISE NOTICE 'סך הכל שורות רכש שהופקו בדוח: %', v_row_count;
    RAISE NOTICE 'הפקת הדוח וחידוש המלאי הסתיימו בהצלחה!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'שגיאה בפעולת התוכנית הראשית 2: % - %', SQLSTATE, SQLERRM;
        -- החזרת סגירה נקראת אם ה-Cursor נסגר לא תחת אילוץ החריגה
        BEGIN
            CLOSE v_report_cursor;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- במקרה והוא לא היה פתוח, נתעלם
        END;
END $$;
