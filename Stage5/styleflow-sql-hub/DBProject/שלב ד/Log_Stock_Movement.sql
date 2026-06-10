-- ===============================================================
-- טריגר 1 (בזמן UPDATE) - לוג תנועות מלאי וחידוש (Log_Stock_Movement.sql)
-- פרויקט: StyleFlow Marketing Hub + Clothing Store System
-- ===============================================================

-- 1. יצירת פונקציית הטריגר (Trigger Function)
CREATE OR REPLACE FUNCTION fn_trg_log_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_diff NUMERIC;
    v_action VARCHAR(255);
BEGIN
    -- בדיקה האם הכמות באמת השתנתה
    IF OLD.quantity_on_hand IS DISTINCT FROM NEW.quantity_on_hand THEN
        v_diff := NEW.quantity_on_hand - OLD.quantity_on_hand;
        
        -- קביעת סוג התנועה שבוצעה
        IF v_diff > 0 THEN
            v_action := 'STOCK_INCREASE: Received ' || v_diff || ' units.';
        ELSE
            v_action := 'STOCK_DECREASE: Distributed ' || ABS(v_diff) || ' units.';
        END IF;

        -- בדיקת יתרת סף קריטית והוספת תמרור אזהרה ללוג
        IF NEW.quantity_on_hand < 10 THEN
            v_action := v_action || ' WARNING: Stock dropped below safety limit (current: ' || NEW.quantity_on_hand || ' units).';
        END IF;

        -- 2. ביצוע הפעולה ההקלטית - יצירת רשומת בקרה בטבלת הלוג שלנו
        INSERT INTO store_stock_audit_log (
            v_id,
            old_quantity,
            new_quantity,
            action_taken
        ) VALUES (
            NEW.v_id,
            OLD.quantity_on_hand,
            NEW.quantity_on_hand,
            v_action
        );
        
        RAISE NOTICE 'Trigger Executed: Stock level modified for variant %. Old: %, New: %. Event logged.',
            NEW.v_id, OLD.quantity_on_hand, NEW.quantity_on_hand;
    END IF;

    -- החזרת השורה החדשה להמשך הפעולה התקנית בבסיס הנתונים
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. יצירת הטריגר עצמו וקישורו לעדכון (UPDATE) בטבלת הווריאציות של מוצרי החנות
DROP TRIGGER IF EXISTS trg_log_stock_movement ON products_variants;

CREATE TRIGGER trg_log_stock_movement
AFTER UPDATE ON products_variants
FOR EACH ROW
EXECUTE FUNCTION fn_trg_log_stock_movement();
