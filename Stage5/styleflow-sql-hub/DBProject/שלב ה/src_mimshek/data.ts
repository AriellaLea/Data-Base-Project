import { 
  StoreCategory, 
  StoreSupplier, 
  StoreWarehouse, 
  StoreProduct, 
  StoreProductVariant, 
  StoreStockOrder, 
  StoreOrderItem, 
  MarketingDirector, 
  AdvertisingCampaign, 
  Promotion,
  StockAuditLog,
  BudgetViolationLog
} from './types';

// Initial preloaded database state matching previous stages (Integrate.sql schemas)
export const initialCategories: StoreCategory[] = [
  { c_id: 10, c_name: 'קולקציית חורף (Winter Collection)' },
  { c_id: 20, c_name: 'בגדי ספורט (Sportswear)' },
  { c_id: 30, c_name: 'אביזרים ונלווים (Accessories)' },
  { c_id: 40, c_name: 'קולקציית קיץ (Summer Essentials)' }
];

export const initialSuppliers: StoreSupplier[] = [
  { s_id: 50, s_name: 'Fashion Group Inc', s_address: 'New York, USA', s_email: 'contact@fashion.com', s_phone: '123-456' },
  { s_id: 60, s_name: 'Sporty Ltd', s_address: 'Berlin, Germany', s_email: 'sales@sporty.com', s_phone: '987-654' },
  { s_id: 70, s_name: 'Elite Textiles', s_address: 'Milan, Italy', s_email: 'info@elite.com', s_phone: '333-888' },
  { s_id: 80, s_name: 'Premium Leather Goods', s_address: 'Madrid, Spain', s_email: 'leather@premium.com', s_phone: '555-777' }
];

export const initialWarehouses: StoreWarehouse[] = [
  { w_id: 100, capacity: 5000, w_location: 'מרלו"ג ראשי - רוטרדם', w_phone: '555-010', manager_name: 'ג׳ון ויק (John Wick)' },
  { w_id: 110, capacity: 3000, w_location: 'איזור צפון - המבורג', w_phone: '555-020', manager_name: 'אלזה סנואו (Elsa Snow)' },
  { w_id: 120, capacity: 1500, w_location: 'סניף תל אביב דפו', w_phone: '555-030', manager_name: 'דני כהן' }
];

export const initialProducts: StoreProduct[] = [
  { p_id: 501, p_name: 'Thermal Parka', p_brand: 'Zara', p_price: 450.00, c_id: 10 },
  { p_id: 502, p_name: 'Running Shoes', p_brand: 'Nike', p_price: 300.00, c_id: 20 },
  { p_id: 503, p_name: 'Denim Jacket', p_brand: 'Levi\'s', p_price: 180.00, c_id: 10 },
  { p_id: 504, p_name: 'Light Sunglasses', p_brand: 'Oakley', p_price: 120.00, c_id: 30 },
  { p_id: 505, p_name: 'Basic Cotton Tee', p_brand: 'H&M', p_price: 45.00, c_id: 40 },
  { p_id: 506, p_name: 'Leather Belt', p_brand: 'Gucci', p_price: 650.00, c_id: 30 }
];

export const initialVariants: StoreProductVariant[] = [
  { v_id: 1001, v_size: 'XL', v_color: 'Navy Blue', quantity_on_hand: 50, p_id: 501, w_id: 100 },
  { v_id: 1002, v_size: 'M', v_color: 'Black', quantity_on_hand: 25, p_id: 502, w_id: 100 },
  { v_id: 1003, v_size: 'S', v_color: 'White', quantity_on_hand: 5, p_id: 502, w_id: 100 }, // Critical Low!
  { v_id: 1004, v_size: 'L', v_color: 'Blue', quantity_on_hand: 8, p_id: 503, w_id: 110 }, // Critical Low!
  { v_id: 1005, v_size: 'One Size', v_color: 'Brown', quantity_on_hand: 12, p_id: 504, w_id: 110 },
  { v_id: 1006, v_size: 'M', v_color: 'Grey', quantity_on_hand: 9, p_id: 505, w_id: 120 }, // Critical Low!
  { v_id: 1007, v_size: 'L', v_color: 'Black', quantity_on_hand: 15, p_id: 506, w_id: 100 }
];

export const initialStockOrders: StoreStockOrder[] = [
  { order_id: 2001, order_date: '2026-04-15', order_status: 'Approved & Inbound', total_amount: 18000.00, s_id: 50 },
  { order_id: 2002, order_date: '2026-04-16', order_status: 'Pending', total_amount: 4050.00, s_id: 60 }
];

export const initialOrderItems: StoreOrderItem[] = [
  { item_id: 3001, unit_cost: 180.00, quantity: 100, order_id: 2001, v_id: 1001 },
  { item_id: 3002, unit_cost: 270.00, quantity: 15, order_id: 2002, v_id: 1002 }
];

export const initialDirectors: MarketingDirector[] = [
  { director_id: 1, director_name: 'שרה לוי (Sarah Levi)', annual_budget: 1000000, strategy_type: 'Performance Marketing' },
  { director_id: 2, director_name: 'מיכאל כהן (Michael Cohen)', annual_budget: 600000, strategy_type: 'Brand Exposure' }
];

export const initialCampaigns: AdvertisingCampaign[] = [
  { campaign_id: 1, director_id: 1, campaign_name: 'קמפיין חורף מעילים', budget: 120000, campaign_efficiency_score: 76.33, supplier_id: 50 },
  { campaign_id: 2, director_id: 1, campaign_name: 'ספורט ובריאות קיץ', budget: 80000, campaign_efficiency_score: 45.00, supplier_id: 60 },
  { campaign_id: 3, director_id: 2, campaign_name: 'קולקציית יוקרה גוצ׳י', budget: 250000, campaign_efficiency_score: 0.00, supplier_id: 70 }
];

export const initialPromotions: Promotion[] = [
  { promo_id: 1, campaign_id: 1, promo_name: 'מבצע חורף קשוח', discount_percent: 20, product_variant_id: 1001 },
  { promo_id: 2, campaign_id: 2, promo_name: 'בגדי ספורט חצי מחיר', discount_percent: 50, product_variant_id: 1002 },
  { promo_id: 3, campaign_id: 3, promo_name: 'הנחת גבעת המותגים', discount_percent: 15, product_variant_id: 1007 }
];

export const initialStockLogs: StockAuditLog[] = [
  { log_id: 50001, v_id: 1003, old_quantity: 55, new_quantity: 5, action_taken: 'STOCK_DECREASE: Distributed 50 units. WARNING: Stock dropped below limit (5).', change_date: '2026-06-07 08:12:44' },
  { log_id: 50002, v_id: 1004, old_quantity: 18, new_quantity: 8, action_taken: 'STOCK_DECREASE: Distributed 10 units. WARNING: Stock dropped below limit (8).', change_date: '2026-06-07 08:15:21' }
];

export const initialBudgetViolations: BudgetViolationLog[] = [
  { violation_id: 60001, campaign_id: 3, attempted_budget: 650000, max_allowed_budget: 300000, violation_date: '2026-06-07 09:05:14', user_alert: 'POL-VIOLATION: Budget 650000 violates the 50% cap of director budget (300000).' }
];
