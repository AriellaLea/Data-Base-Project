# Data-Base-Project 
CREATE TABLE PROMOTIONS
(
  promo_id INT NOT NULL,
  promo_name INT NOT NULL,
  discount_percent INT NOT NULL,
  valid_from INT NOT NULL,
  valid_to INT NOT NULL,
  usage_limit INT NOT NULL,
  PRIMARY KEY (promo_id)
);

CREATE TABLE CAMPAIGNS
(
  campaign_id INT NOT NULL,
  campaign_name INT NOT NULL,
  start_date INT NOT NULL,
  end_date INT NOT NULL,
  budget INT NOT NULL,
  metadata INT NOT NULL,
  status INT NOT NULL,
  promo_id INT NOT NULL,
  PRIMARY KEY (campaign_id),
  FOREIGN KEY (promo_id) REFERENCES PROMOTIONS(promo_id)
);

CREATE TABLE MEDIACHANNELS
(
  channel_id INT NOT NULL,
  channel_name INT NOT NULL,
  channel_type INT NOT NULL,
  cost_per_click INT NOT NULL,
  audience_stats INT NOT NULL,
  is_active INT NOT NULL,
  campaign_id INT NOT NULL,
  PRIMARY KEY (channel_id),
  FOREIGN KEY (campaign_id) REFERENCES CAMPAIGNS(campaign_id)
);

CREATE TABLE PRODUCTS
(
  product_id INT NOT NULL,
  product_name INT NOT NULL,
  category INT NOT NULL,
  price INT NOT NULL,
  sku INT NOT NULL,
  stock_quantity INT NOT NULL,
  PRIMARY KEY (product_id)
);

CREATE TABLE CUSTOMERS
(
  customer_id INT NOT NULL,
  first_name INT NOT NULL,
  last_name INT NOT NULL,
  email INT NOT NULL,
  date_of_birth INT NOT NULL,
  loyalty_points INT NOT NULL,
  registration_date INT NOT NULL,
  Attribute INT NOT NULL,
  PRIMARY KEY (customer_id)
);

CREATE TABLE BRANCHES
(
  branch_id INT NOT NULL,
  branch_name INT NOT NULL,
  city_id INT NOT NULL,
  manager_name INT NOT NULL,
  opening_hours INT NOT NULL,
  square_footage INT NOT NULL,
  Attribute INT NOT NULL,
  campaign_id INT NOT NULL,
  PRIMARY KEY (branch_id),
  FOREIGN KEY (campaign_id) REFERENCES CAMPAIGNS(campaign_id)
);

CREATE TABLE PRODUCT_PROMOTION
(
  product_id INT NOT NULL,
  promo_id INT NOT NULL,
  PRIMARY KEY (product_id, promo_id),
  FOREIGN KEY (product_id) REFERENCES PRODUCTS(product_id),
  FOREIGN KEY (promo_id) REFERENCES PROMOTIONS(promo_id)
);

CREATE TABLE CAMPAIGN_CUSTOMER
(
  customer_id INT NOT NULL,
  campaign_id INT NOT NULL,
  PRIMARY KEY (customer_id, campaign_id),
  FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id),
  FOREIGN KEY (campaign_id) REFERENCES CAMPAIGNS(campaign_id)
);
