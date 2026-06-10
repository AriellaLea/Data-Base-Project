-- ===============================================================
-- טריגר 2 (בזמן INSERT / UPDATE) - אכיפת מדיניות תקציב קמפיינים (Enforce_Campaign_Budget_Policy.sql)
-- פרויקט: StyleFlow Marketing Hub + Clothing Store System
-- ===============================================================

-- 1. יצירת פונקציית הטריגר (Trigger Function)
CREATE OR REPLACE FUNCTION fn_trg_enforce_campaign_budget_policy()
RETURNS TRIGGER AS $$
DECLARE
    v_director_annual_budget NUMERIC(15,2);
    v_max_campaign_limit NUMERIC(15,2);
    v_violation_msg VARCHAR(255);
BEGIN
    -- א. וולידציה פשוטה - אם התקציב שהוגדר שלילי, זורקים שגיאה מידית
    IF NEW.budget < 0 THEN
        RAISE EXCEPTION 'Campaign budget cannot be negative (Attempted budget: %).', NEW.budget
            USING ERRCODE = '22023'; -- Invalid parameter value
    END IF;

    -- ב. קבלת התקציב השנתי הכולל של המנהל מהמטה הראשי
    SELECT annual_budget INTO v_director_annual_budget
    FROM marketing_management
    WHERE director_id = NEW.director_id;

    -- ג. אם המנהל קיים, אוכפים את החוק: אסור לקמפיין בודד לצרוך מעל 50% מהתקציב השנתי
    IF v_director_annual_budget IS NOT NULL THEN
        v_max_campaign_limit := v_director_annual_budget * 0.50;
        
        IF NEW.budget > v_max_campaign_limit THEN
            v_violation_msg := 'POL-VIOLATION: Campaign budget ' || NEW.budget || 
                               ' violates the 50% annual cap policy of director budget (' || v_max_campaign_limit || ').';
            
            -- 2. רישום אירוע החריגה בטבלת לוג החריגות לביקורת פיננסית
            INSERT INTO campaign_budget_violations_log (
                campaign_id,
                attempted_budget,
                max_allowed_budget,
                user_alert
            ) VALUES (
                NEW.campaign_id,
                NEW.budget,
                v_max_campaign_limit,
                v_violation_msg
            );
            
            -- 3. הלבשה ריכוזית: "הלבשת" הערך הקיים במקסימום המקביל כדי שהטרנזקציה תמשיך ללא כישלון קשה
            NEW.budget := CAST(v_max_campaign_limit AS INT);
            
            RAISE NOTICE 'Campaign Budget Enforcer: Budget for "%" (ID: %) was capped to % to abide by the annual limit policy.',
                NEW.campaign_name, NEW.campaign_id, NEW.budget;
        END IF;
    END IF;

    -- החזרת רשומת השורה המעודכנת להזנה
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. יצירת הטריגר עצמו וקישורו לפעולות הוספה או עדכון (BEFORE INSERT OR UPDATE) בקמפיינים
DROP TRIGGER IF EXISTS trg_enforce_campaign_budget_policy ON advertising_campaigns;

CREATE TRIGGER trg_enforce_campaign_budget_policy
BEFORE INSERT OR UPDATE ON advertising_campaigns
FOR EACH ROW
EXECUTE FUNCTION fn_trg_enforce_campaign_budget_policy();
