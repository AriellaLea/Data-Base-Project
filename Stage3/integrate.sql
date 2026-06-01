UPDATE products
SET stock_quantity = floor(random()  491 + 10)
WHERE stock_quantity IS NULL;

UPDATE products p
SET category_id = CASE
   -- if it's socks - 506
    WHEN LOWER(split_part(p.product_name, ' ', 2)) = 'socks' THEN 506
-- if it's a jacket or a coat - 501
    WHEN LOWER(split_part(p.product_name, ' ', 2)) IN ('jacket', 'coat') THEN 501
--if it's a sweater - 507
WHEN LOWER(split_part(p.product_name, ' ', 2)) = 'sweater' THEN 507

    -- if it's a word without 's' at the end, look for a word with a 's' in the table categories
   WHEN LOWER(split_part(p.product_name, ' ', 2)) = 't-shirt'
        THEN (SELECT c.category_id FROM categories c WHERE LOWER(c.category_name) = 't-shirts' LIMIT 1)
    WHEN LOWER(split_part(p.product_name, ' ', 2)) = 'dress'
        THEN (SELECT c.category_id FROM categories c WHERE LOWER(c.category_name) = 'dresses' LIMIT 1)
    WHEN LOWER(split_part(p.product_name, ' ', 2)) = 'bag'
        THEN (SELECT c.category_id FROM categories c WHERE LOWER(c.category_name) = 'bags' LIMIT 1)
    WHEN LOWER(split_part(p.product_name, ' ', 2)) = 'skirt'
        THEN (SELECT c.category_id FROM categories c WHERE LOWER(c.category_name) = 'skirts' LIMIT 1)
    WHEN LOWER(split_part(p.product_name, ' ', 2)) = 'suit'
        THEN (SELECT c.category_id FROM categories c WHERE LOWER(c.category_name) = 'suits' LIMIT 1)

 -- else, look for ID in the table categories
    ELSE (SELECT c.category_id FROM categories c WHERE LOWER(c.category_name) = LOWER(split_part(p.product_name, ' ', 2)) LIMIT 1)
END
WHERE p.category_id IS NULL
  AND (
    LOWER(split_part(p.product_name, ' ', 2)) IN ('socks', 'jacket', 'coat', 't-shirt', 'dress', 'bag', 'skirt', 'suit','sweater')
    OR EXISTS (SELECT 1 FROM categories c WHERE LOWER(c.category_name) = LOWER(split_part(p.product_name, ' ', 2)))
  );
