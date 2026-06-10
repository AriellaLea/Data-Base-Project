-- ===============================================================
-- פונקציה 1 - חישוב יעילות קמפיין שיווקי ומלאי (Calculate_Campaign_Efficiency.sql)
-- פרויקט: StyleFlow Marketing Hub + Clothing Store System
-- ===============================================================

CREATE OR REPLACE FUNCTION fn_calculate_campaign_efficiency(p_campaign_id INT)
RETURNS NUMERIC AS $$
DECLARE
    -- משתנים לחישוב עלויות קמפיין
    v_campaign_budget NUMERIC(15,2);
    v_total_platform_cost NUMERIC(15,2) := 0;
    v_total_investment NUMERIC(15,2);
    
    -- מדדי מלאי ומבצעים
    v_total_promoted_stock NUMERIC(15,0) := 0;
    v_weighted_discount NUMERIC(15,2) := 0;
    v_efficiency_score NUMERIC(5,2) := 0.00;
    
    -- רשומה לשימוש בלולאת Cursor
    r_promo RECORD;
    
    -- הגדרת Cursor מפורש (Explicit Cursor) לשליפת מבצעי הקמפיין והמוצרים המקושרים
    cur_promotions CURSOR FOR 
        SELECT p.promo_id, p.discount_percent, pp.product_id, pv.quantity_on_hand
        FROM promotions p
        LEFT JOIN promotion_products pp ON p.promo_id = pp.promo_id
        LEFT JOIN products_variants pv ON pp.product_id = pv.p_id
        WHERE p.campaign_id = p_campaign_id;
        
BEGIN
    -- 1. שליפת תקציב הקמפיין הראשי תוך טיפול בחריגה אם הקמפיין לא קיים
    SELECT budget INTO v_campaign_budget
    FROM advertising_campaigns
    WHERE campaign_id = p_campaign_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campaign with ID % does not exist in the system.', p_campaign_id
            USING ERRCODE = 'P0002'; -- No data found code
    END IF;
    
    -- 2. חישוב סך עלות פלטפורמות הפרסום של הקמפיין (Cursor מרומז - Implicit Cursor)
    SELECT COALESCE(SUM(price), 0) INTO v_total_platform_cost
    FROM advertising_platforms
    WHERE campaign_id = p_campaign_id;
    
    v_total_investment := COALESCE(v_campaign_budget, 0) + v_total_platform_cost;
    
    -- בדיקה למניעת חלוקה באפס בעזרת EXCEPTION ייעודי
    IF v_total_investment = 0 THEN
        RAISE EXCEPTION 'Division by zero: Campaign % has zero total investment (budget + platform costs is 0).', p_campaign_id
            USING ERRCODE = '22012'; -- Division by zero code
    END IF;

    -- 3. פתיחה וסריקה של ה-Cursor המפורש (Explicit Cursor) באמצעות לולאת FOR אלגנטית
    OPEN cur_promotions;
    LOOP
        FETCH cur_promotions INTO r_promo;
        EXIT WHEN NOT FOUND;
        
        -- תנאים לפעולת צבירה רק אם יש מלאי משוייך
        IF r_promo.quantity_on_hand IS NOT NULL AND r_promo.quantity_on_hand > 0 THEN
            v_total_promoted_stock := v_total_promoted_stock + r_promo.quantity_on_hand;
            v_weighted_discount := v_weighted_discount + (r_promo.quantity_on_hand * (r_promo.discount_percent / 100.0));
        END IF;
    END LOOP;
    CLOSE cur_promotions;

    -- 4. חישוב הציון הסופי המבוסס על אחוז ההנחה והמלאי חלקי ההשקעה בקמפיין
    IF v_total_promoted_stock > 0 THEN
        -- מדד יעילות: המכפלה של ערך ההנחה המשוקלל במלאי חלקי ההשקעה הכוללת בקולקציה
        v_efficiency_score := LEAST(((v_weighted_discount * 1000.0) / v_total_investment), 999.99);
    ELSE
        v_efficiency_score := 0.00;
    END IF;
    
    -- עדכון הציון בטבלה עצמה (DML פעולת עדכון מקומית)
    UPDATE advertising_campaigns
    SET campaign_efficiency_score = v_efficiency_score
    WHERE campaign_id = p_campaign_id;
    
    RETURN v_efficiency_score;

EXCEPTION
    WHEN division_by_zero THEN
        RAISE NOTICE 'Caught Division By Zero inside function - campaign has no budget or cost.';
        RETURN 0.00;
    WHEN OTHERS THEN
        RAISE NOTICE 'An unexpected error occurred: % - %', SQLSTATE, SQLERRM;
        RETURN -1.00;
END;
$$ LANGUAGE plpgsql;
