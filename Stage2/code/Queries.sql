-- ===============================================================
-- Phase B: Queries
-- StyleFlow Marketing Hub
-- ===============================================================

-- 1. SELECT QUERIES
-- ---------------------------------------------------------------

-- Query 1 (Two ways): Find customers from 'Tel Aviv' with more than 100 points.
-- Way A: Using JOIN (Usually more readable)
SELECT c.customer_id, c.name, c.points_balance, ci.city_name
FROM customers c
JOIN loyalty_levels l ON c.loyalty_level_id = l.loyalty_id
JOIN campaign_customers cc ON c.customer_id = cc.customer_id
JOIN advertising_campaigns camp ON cc.campaign_id = camp.campaign_id
JOIN campaign_branches cb ON camp.campaign_id = cb.campaign_id
JOIN branches b ON cb.branch_id = b.branch_id
JOIN cities ci ON b.city_id = ci.city_id
WHERE ci.city_name = 'Tel Aviv' AND c.points_balance > 100
LIMIT 5;

-- Way B: Using EXISTS (Subquery)
SELECT c.customer_id, c.name, c.points_balance
FROM customers c
WHERE c.points_balance > 100 
AND EXISTS (
    SELECT 1 FROM campaign_customers cc
    JOIN advertising_campaigns camp ON cc.campaign_id = camp.campaign_id
    JOIN campaign_branches cb ON camp.campaign_id = cb.campaign_id
    JOIN branches b ON cb.branch_id = b.branch_id
    JOIN cities ci ON b.city_id = ci.city_id
    WHERE cc.customer_id = c.customer_id AND ci.city_name = 'Tel Aviv'
)
LIMIT 5;


-- Query 2 (Two ways): Find products in 'Electronics' category that are part of an active promotion.
-- Way A: Explicit JOIN
SELECT p.product_id, p.product_name, p.price, pr.promo_name
FROM products p
JOIN categories c ON p.category_id = c.category_id
JOIN promotion_products pp ON p.product_id = pp.product_id
JOIN promotions pr ON pp.promo_id = pr.promo_id
WHERE c.category_name = 'Electronics' 
AND CURRENT_DATE BETWEEN pr.valid_from AND pr.valid_to;

-- Way B: Using IN with Subquery
SELECT product_id, product_name, price
FROM products
WHERE category_id IN (SELECT category_id FROM categories WHERE category_name = 'Electronics')
AND product_id IN (
    SELECT product_id FROM promotion_products 
    WHERE promo_id IN (
        SELECT promo_id FROM promotions 
        WHERE CURRENT_DATE BETWEEN valid_from AND valid_to
    )
);


-- Query 3 (Two ways): Campaign platform costs for specific campaigns.
-- Way A: JOIN and filters
SELECT camp.campaign_name, plat.platform_name, plat.price
FROM advertising_campaigns camp
JOIN advertising_platforms plat ON camp.campaign_id = plat.platform_id
WHERE plat.price > 5000;

-- Way B: Using CTE (Common Table Expression)
WITH HighCostPlatforms AS (
    SELECT platform_id, campaign_id, platform_name, price 
    FROM advertising_platforms 
    WHERE price > 5000
)
SELECT camp.campaign_name, hcp.platform_name, hcp.price
FROM advertising_campaigns camp
JOIN HighCostPlatforms hcp ON camp.campaign_id = hcp.campaign_id;


-- Query 4 (Two ways): Find managers of branches in a specific city.
-- Way A: Direct Join
SELECT b.branch_name, b.manager_name, ci.city_name
FROM branches b
JOIN cities ci ON b.city_id = ci.city_id
WHERE ci.city_name = 'Jerusalem';

-- Way B: Subquery in SELECT (Less efficient for large data, but valid)
SELECT b.branch_name, b.manager_name, 
       (SELECT city_name FROM cities WHERE city_id = b.city_id) as city_name
FROM branches b
WHERE city_id = (SELECT city_id FROM cities WHERE city_name = 'Jerusalem');


-- Remaining 4 SELECT Queries:
-- ---------------------------------------------------------------

-- 5. Total budget per strategy type for active campaigns
SELECT st.strategy_name, SUM(camp.budget) as total_strategy_budget, COUNT(*) as campaign_count
FROM strategy_types st
JOIN marketing_management mm ON st.strategy_id = mm.strategy_type_id
JOIN advertising_campaigns camp ON mm.director_id = camp.director_id
JOIN campaign_status s ON camp.status_id = s.status_id
WHERE s.status_name = 'Active'
GROUP BY st.strategy_name
ORDER BY total_strategy_budget DESC;

-- 6. Customers with point balance higher than average points in their loyalty tier
SELECT c.name, c.points_balance, l.level_name
FROM customers c
JOIN loyalty_levels l ON c.loyalty_level_id = l.loyalty_id
WHERE c.points_balance > (
    SELECT AVG(points_balance) 
    FROM customers 
    WHERE loyalty_level_id = c.loyalty_level_id
);

-- 7. Platform reach by category for campaigns starting in 2025
SELECT pc.category_name, SUM(ap.audience_reach) as total_reach, AVG(ap.price) as avg_price
FROM platform_categories pc
JOIN advertising_platforms ap ON pc.category_id = ap.category_id
JOIN advertising_campaigns ac ON ap.campaign_id = ac.campaign_id
WHERE EXTRACT(YEAR FROM ac.start_date) = 2025
GROUP BY pc.category_name;

-- 8. Top 3 most expensive products per category using Window Function
SELECT * FROM (
    SELECT p.product_name, cat.category_name, p.price,
           RANK() OVER (PARTITION BY p.category_id ORDER BY p.price DESC) as price_rank
    FROM products p
    JOIN categories cat ON p.category_id = cat.category_id
) ranked_products
WHERE price_rank <= 3;


-- 2. UPDATE QUERIES
-- ---------------------------------------------------------------

-- 1. Reward customers: Add 500 points to all customers who participated in an 'Active' campaign.
UPDATE customers
SET points_balance = points_balance + 500
WHERE customer_id IN (
    SELECT cc.customer_id 
    FROM campaign_customers cc
    JOIN advertising_campaigns ac ON cc.campaign_id = ac.campaign_id
    JOIN campaign_status cs ON ac.status_id = cs.status_id
    WHERE cs.status_name = 'Active'
);

-- 2. Update campaign status to 'Completed' if end date is passed.
UPDATE advertising_campaigns
SET status_id = (SELECT status_id FROM campaign_status WHERE status_name = 'Completed')
WHERE end_date < CURRENT_DATE 
AND status_id != (SELECT status_id FROM campaign_status WHERE status_name = 'Completed');

-- 3. Increase prices for products in 'Fashion' category by 5% due to inflation.
UPDATE products
SET price = price * 1.05
WHERE category_id = (SELECT category_id FROM categories WHERE category_name = 'Fashion');


-- 3. DELETE QUERIES
-- ---------------------------------------------------------------

-- 1. Remove products that have no stock and are not part of any promotion.
DELETE FROM products
WHERE stock_quantity = 0 
AND product_id NOT IN (SELECT product_id FROM promotion_products);

-- 2. Remove platforms that cost too much and have low reach (reach < 1000 and price > 10000).
DELETE FROM advertising_platforms
WHERE audience_reach < 1000 AND price > 10000;

-- 3. Remove inactive campaign links for branches that are no longer participating (using nested subqueries).
DELETE FROM campaign_branches
WHERE campaign_id IN (
    SELECT campaign_id 
    FROM advertising_campaigns 
    WHERE status_id IN (
        SELECT status_id 
        FROM campaign_status 
        WHERE status_name = 'Cancelled'
    )
);
