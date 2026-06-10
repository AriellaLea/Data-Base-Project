-- ===============================================================
-- פרוצדורה 2 - ייעול ואופטימיזציית תקציבי קמפיינים (Adjust_Campaign_Budgets.sql)
-- פרויקט: StyleFlow Marketing Hub + Clothing Store System
-- ===============================================================

CREATE OR REPLACE PROCEDURE sp_adjust_campaign_budgets(
    p_director_id INT,
    p_max_budget_allowed INT
) AS $$
DECLARE
    -- מונים למעקב
    v_director_exists INT;
    v_updated_campaigns_count INT := 0;
    
    -- רשומה של הקמפיין לשימוש בלולאה מרומזת
    r_camp RECORD;
    
    -- משתני ביניים לניתוח שיווקי
    v_platform_costs_sum INT;
    v_suggested_new_budget INT;
BEGIN
    -- 1. וולידציה - בדיקה שהמנהל קיים במחלקת הניהול השיווקית
    SELECT COUNT(*) INTO v_director_exists 
    FROM marketing_management
    WHERE director_id = p_director_id;
    
    IF v_director_exists = 0 THEN
        RAISE EXCEPTION 'Director with ID % was not found in Marketing Management.', p_director_id
            USING ERRCODE = 'P0002';
    END IF;

    RAISE NOTICE 'Starting budget analysis for campaigns managed by Director: %', p_director_id;

    -- 2. שימוש ב-Implicit Cursor (לולאת FOR ישירה על פקודת SELECT) לסריקת כל קמפייני המנהל
    FOR r_camp IN 
        SELECT campaign_id, campaign_name, budget, start_date, end_date
        FROM advertising_campaigns
        WHERE director_id = p_director_id
    LOOP
        -- חישוב עלות פלטפורמות עבור כל קמפיין בנפרד
        SELECT COALESCE(SUM(price), 0) INTO v_platform_costs_sum
        FROM advertising_platforms
        WHERE campaign_id = r_camp.campaign_id;
        
        RAISE NOTICE 'Analyzing Campaign: "%" (ID: %), Current Budget: %, Platform Spend: %', 
            r_camp.campaign_name, r_camp.campaign_id, r_camp.budget, v_platform_costs_sum;
            
        -- 3. לוגיקת קבלת החלטה לשינוי תקציב (Conditional Branching)
        -- אם עלויות הפלטפורמות מתקרבות מאוד לתקציב (למשל, מעל 80% מהתקציב הנוכחי) חובה להעלות את התקציב למניעת עצירת פעילות
        IF v_platform_costs_sum >= (r_camp.budget * 0.80) THEN
            v_suggested_new_budget := GREATEST(r_camp.budget * 1.25, v_platform_costs_sum + 5000);
            
            -- בדיקת מגבלת תקציב מרבית
            IF v_suggested_new_budget > p_max_budget_allowed THEN
                -- שגיאת חריגה מוסכמת - במקום לקרוס מוגדר טיפול שיקבע את התקציב לריכוז המקסימלי האפשרי
                RAISE NOTICE 'Warning: Suggested budget (%) for campaign "%" exceeds maximum allowed cap (%). Capping budget.', 
                    v_suggested_new_budget, r_camp.campaign_name, p_max_budget_allowed;
                v_suggested_new_budget := p_max_budget_allowed;
            END IF;
            
            -- ביצוע פעולת עדכון (DML)
            UPDATE advertising_campaigns
            SET budget = v_suggested_new_budget
            WHERE campaign_id = r_camp.campaign_id;
            
            v_updated_campaigns_count := v_updated_campaigns_count + 1;
            RAISE NOTICE 'Campaign "%" updated to new budget: %', r_camp.campaign_name, v_suggested_new_budget;
            
        -- אם עלויות הפרסום קטנות מחצי מהתקציב, מקטינים קלות את התקציב הלא מנוצל לשימוש בקמפיינים אחרים
        ELSIF v_platform_costs_sum < (r_camp.budget * 0.40) AND r_camp.budget > 10000 THEN
            v_suggested_new_budget := r_camp.budget * 0.90;
            
            UPDATE advertising_campaigns
            SET budget = v_suggested_new_budget
            WHERE campaign_id = r_camp.campaign_id;
            
            v_updated_campaigns_count := v_updated_campaigns_count + 1;
            RAISE NOTICE 'Optimized Campaign "%": unused space saved. New budget: %', r_camp.campaign_name, v_suggested_new_budget;
        END IF;

    END LOOP;

    RAISE NOTICE 'Optimization completed. % campaigns had their budgets adjusted.', v_updated_campaigns_count;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error inside Campaign Budget Optimization Procedure: % - %', SQLSTATE, SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;
