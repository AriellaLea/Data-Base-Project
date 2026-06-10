export interface StoreCategory {
  c_id: number;
  c_name: string;
}

export interface StoreSupplier {
  s_id: number;
  s_name: string;
  s_address: string;
  s_email: string;
  s_phone: string;
}

export interface StoreWarehouse {
  w_id: number;
  capacity: number;
  w_location: string;
  w_phone: string;
  manager_name: string;
}

export interface StoreProduct {
  p_id: number;
  p_name: string;
  p_brand: string;
  p_price: number;
  c_id: number | null; // category_id
}

export interface StoreProductVariant {
  v_id: number;
  v_size: string;
  v_color: string;
  quantity_on_hand: number;
  p_id: number; // product_id
  w_id: number; // warehouse_id
}

export interface StoreStockOrder {
  order_id: number;
  order_date: string;
  order_status: string; // 'Pending' | 'Approved & Inbound' | 'Restock Draft' | 'Cancelled'
  total_amount: number;
  s_id: number; // supplier_id
}

export interface StoreOrderItem {
  item_id: number;
  unit_cost: number;
  quantity: number;
  order_id: number;
  v_id: number; // variant_id
}

export interface MarketingDirector {
  director_id: number;
  director_name: string;
  annual_budget: number;
  strategy_type: string;
}

export interface AdvertisingCampaign {
  campaign_id: number;
  director_id: number;
  campaign_name: string;
  budget: number;
  campaign_efficiency_score: number;
  supplier_id: number | null;
}

export interface Promotion {
  promo_id: number;
  campaign_id: number;
  promo_name: string;
  discount_percent: number;
  product_variant_id: number | null;
}

export interface StockAuditLog {
  log_id: number;
  v_id: number;
  old_quantity: number | null;
  new_quantity: number;
  action_taken: string;
  change_date: string;
}

export interface BudgetViolationLog {
  violation_id: number;
  campaign_id: number;
  attempted_budget: number;
  max_allowed_budget: number;
  violation_date: string;
  user_alert: string;
}
