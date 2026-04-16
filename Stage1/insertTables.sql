-- MÉTHODE 1 : Insertion manuelle (INSERT INTO)
INSERT INTO strategy_types (strategy_id, strategy_name) VALUES (1, 'Aggressive')
ON CONFLICT (strategy_id) DO NOTHING;

-- MÉTHODE 2 : Importation massive via CSV et Script Python
-- Commande utilisée dans pgAdmin :
-- COPY customers FROM 'C:/Users/Public/customers.csv' DELIMITER ',' CSV HEADER;
-- COPY products FROM 'C:/Users/Public/products.csv' DELIMITER ',' CSV HEADER;

-- MÉTHODE 3 : Génération automatique via SQL (generate_series)
-- Utilisé pour remplir les tables de référence à 500 lignes :
-- INSERT INTO cities (city_id, city_name) SELECT i, 'City_' || i FROM generate_series(1, 500) AS i;