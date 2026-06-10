-- =================================================================
-- שלב ג - מבטים ושילוב בסיסי הנתונים (Views.sql)
-- פרויקט: StyleFlow Marketing Hub (Integrated)
-- =================================================================

-- =================================================================
-- 1. View from received department (מבט מהאגף שנתקבל)
-- =================================================================
-- תיאור: מבט על קטגוריית מותגי יוקרה / תקציב נוח המיועד לפילוח מוצרים שיווקי
CREATE VIEW marketing_view AS
SELECT
    p.product_id AS product_code,
    p.product_name AS product_name,
    p.price AS price,
    CASE
        WHEN p.price > 100 THEN 'Luxury'
        ELSE 'Affordable'
    END AS marketing_position
FROM products p
WHERE p.price >= 50;


-- Query 1.1 :
-- הצגת מוצרי יצרני יוקרה בלבד (Luxury products)
SELECT product_name, price
FROM marketing_view
WHERE marketing_position = 'Luxury';

-- Query 1.2 :
-- חישוב מחיר ממוצע של מוצרים מקטגוריית היוקרה (Average price of luxury products)
SELECT AVG(price) AS average_price_premium
FROM marketing_view
WHERE marketing_position = 'Luxury';

-- =================================================================
-- 2. View from our own department (מבט מהאגף המקורי שלנו)
-- =================================================================
-- תיאור: מבט לוגיסטי על מוצרים עם כמויות מלאי נמוכות (מתחת ל-10 יחידות במלאי)
CREATE VIEW logistic_view AS
SELECT
    p.product_id AS product_code,
    p.product_name AS product_name,
    c.category_name AS category,
    p.stock_quantity AS left_quantity
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.stock_quantity < 10;


-- Query 2.1 :
-- מציאת הפריט עם מלאי הקצה הנמוך ביותר במערכת
SELECT product_name, left_quantity 
FROM logistic_view
ORDER BY left_quantity ASC
LIMIT 1;

-- Query 2.2 :
-- ספירת כמות הפריטים קריטי המלאי (אזעקה אדומה) לפי קטגוריות
SELECT category, COUNT(*) AS red_alert_products
FROM logistic_view
GROUP BY category;
