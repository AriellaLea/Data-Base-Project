-- ===============================================================
-- תוכנית ראשית 1 - בדיקה וסנכרון תקציבי ויעילות קמפיינים (Main_Block_1_ROI_and_Budget.sql)
-- פרויקט: StyleFlow Marketing Hub + Clothing Store System
-- ===============================================================

DO $$
DECLARE
    -- מזהי מנהל וקמפיין ייעודיים לבדיקה
    v_test_director_id INT := 1;      -- מזהה המנהל המקורי במערכת השיווק
    v_test_campaign_id INT := 1;      -- מזהה הקמפיין לבדיקה של יעילות המלאי
    
    -- מגבלות ומשתני פלט
    v_max_campaign_cap INT := 250000;
    v_calculated_efficiency REAL;
    v_campaign_name VARCHAR(255);
    v_final_budget INT;
    
BEGIN
    RAISE NOTICE '--- תוכנית ראשית 1: סנכרון תקציב וניתוח יעילות קמפיין ---';
    
    -- 1. קריאה לפרוצדורה: sp_adjust_campaign_budgets לייעול תקציבי הקמפיינים של המנהל
    -- הפרוצדורה תסרוק את כל קמפייני המנהל ותעדכן את תקציביהם על סמך ניתוח עלויות פלטפורמה
    RAISE NOTICE 'שלב א: עדכון ואופטימיזציית תקציבי קמפיינים למנהל %...', v_test_director_id;
    CALL sp_adjust_campaign_budgets(v_test_director_id, v_max_campaign_cap);
    
    -- 2. שלב של סקר נתונים מקומי לפלטפורמה ולמנהל
    SELECT campaign_name, budget INTO v_campaign_name, v_final_budget
    FROM advertising_campaigns
    WHERE campaign_id = v_test_campaign_id;
    
    RAISE NOTICE 'שלב ב: נתוני קמפיין % לאחר עדכון התקציב - שם: "%", תקציב סופי: %', 
        v_test_campaign_id, v_campaign_name, v_final_budget;
        
    -- 3. קריאה לפונקציה: fn_calculate_campaign_efficiency לקבלת מדד יעילות הקמפיין ויחס ההנחה/מלאי
    RAISE NOTICE 'שלב ג: חישוב מדד היעילות לקמפיין "%" (ID: %)...', v_campaign_name, v_test_campaign_id;
    v_calculated_efficiency := fn_calculate_campaign_efficiency(v_test_campaign_id);
    
    RAISE NOTICE 'תוצאת הרצה: מדד היעילות שחושב הוא: % (נקודות יעילות פנימיות)', v_calculated_efficiency;
    RAISE NOTICE '---------------------------------------------------------';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'שגיאה בפעולת התוכנית הראשית 1: % - %', SQLSTATE, SQLERRM;
END $$;
