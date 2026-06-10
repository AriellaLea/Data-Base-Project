import React, { useState } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Edit, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  X, 
  RefreshCw,
  FolderMinus
} from 'lucide-react';
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
} from '../types';

type DatabaseTable = 
  | 'categories' 
  | 'suppliers' 
  | 'warehouses' 
  | 'products' 
  | 'variants' 
  | 'stock_orders' 
  | 'order_items' 
  | 'directors' 
  | 'campaigns' 
  | 'promotions';

interface CrudConsoleProps {
  categories: StoreCategory[];
  suppliers: StoreSupplier[];
  warehouses: StoreWarehouse[];
  products: StoreProduct[];
  variants: StoreProductVariant[];
  stockOrders: StoreStockOrder[];
  orderItems: StoreOrderItem[];
  directors: MarketingDirector[];
  campaigns: AdvertisingCampaign[];
  promotions: Promotion[];
  setCategories: React.Dispatch<React.SetStateAction<StoreCategory[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<StoreSupplier[]>>;
  setWarehouses: React.Dispatch<React.SetStateAction<StoreWarehouse[]>>;
  setProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
  setVariants: React.Dispatch<React.SetStateAction<StoreProductVariant[]>>;
  setStockOrders: React.Dispatch<React.SetStateAction<StoreStockOrder[]>>;
  setOrderItems: React.Dispatch<React.SetStateAction<StoreOrderItem[]>>;
  setDirectors: React.Dispatch<React.SetStateAction<MarketingDirector[]>>;
  setCampaigns: React.Dispatch<React.SetStateAction<AdvertisingCampaign[]>>;
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  addStockLog: (vId: number, oldQ: number | null, newQ: number, action: string) => void;
  addViolationLog: (campaignId: number, attempted: number, maxAllowed: number, alertMsg: string) => void;
}

export default function CrudConsole({
  categories, suppliers, warehouses, products, variants, stockOrders, orderItems, directors, campaigns, promotions,
  setCategories, setSuppliers, setWarehouses, setProducts, setVariants, setStockOrders, setOrderItems, setDirectors, setCampaigns, setPromotions,
  addStockLog, addViolationLog
}: CrudConsoleProps) {

  const [activeTable, setActiveTable] = useState<DatabaseTable>('products');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom states for showing forms
  const [isInsertMode, setIsInsertMode] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  
  // Feedback alerts
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Prefilled manual key selection field (Specifically for required "בזמן עדכון - המשתמש ימלא מפתח והמערכת תביא את יתר השדות")
  const [selectedKeyForPreload, setSelectedKeyForPreload] = useState<string>('');

  // Form State
  const [formsState, setFormsState] = useState<Record<string, any>>({});

  // Reset forms
  const resetForm = () => {
    setFormsState({});
    setIsInsertMode(false);
    setIsUpdateMode(false);
    setErrorAlert(null);
    setSelectedKeyForPreload('');
  };

  const showSuccess = (msg: string) => {
    setSuccessAlert(msg);
    setTimeout(() => setSuccessAlert(null), 4000);
  };

  const tablesList: { id: DatabaseTable; label: string; count: number }[] = [
    { id: 'products', label: 'מוצרי החנות (Products)', count: products.length },
    { id: 'variants', label: 'וריאציות פריטים (Variants)', count: variants.length },
    { id: 'categories', label: 'קטגוריות (Categories)', count: categories.length },
    { id: 'suppliers', label: 'ספקים (Suppliers)', count: suppliers.length },
    { id: 'warehouses', label: 'מחסנים (Warehouses)', count: warehouses.length },
    { id: 'stock_orders', label: 'הזמנות רכש (Stock Orders)', count: stockOrders.length },
    { id: 'order_items', label: 'פריטי הזמנה (Order Items)', count: orderItems.length },
    { id: 'directors', label: 'מנהלי שיווק (Directors)', count: directors.length },
    { id: 'campaigns', label: 'קמפיינים שיווקיים (Campaigns)', count: campaigns.length },
    { id: 'promotions', label: 'מבצעי הנחה (Promotions)', count: promotions.length },
  ];

  // Helper resolvers to hide raw IDs and replace them with rich descriptions (MANDATORY REQUIREMENT)
  const resolveCategoryName = (cId: number | null) => {
    if (cId === null) return <span className="text-slate-400 italic">ללא קטגוריה</span>;
    const cat = categories.find(c => c.c_id === cId);
    return cat ? cat.c_name.split(' (')[0] : `קטגוריה #${cId}`;
  };

  const resolveProductName = (pId: number) => {
    const prod = products.find(p => p.p_id === pId);
    return prod ? `${prod.p_name} (${prod.p_brand})` : `מוצר #${pId}`;
  };

  const resolveWarehouseLocation = (wId: number) => {
    const w = warehouses.find(wh => wh.w_id === wId);
    return w ? w.w_location.split(' - ')[0] : `מחסן #${wId}`;
  };

  const resolveSupplierName = (sId: number | null) => {
    if (sId === null) return <span className="text-slate-400 italic">ללא ספק</span>;
    const s = suppliers.find(sup => sup.s_id === sId);
    return s ? s.s_name : `ספק #${sId}`;
  };

  const resolveVariantName = (vId: number | null) => {
    if (vId === null) return <span className="text-slate-400 italic font-normal">ללא וריאציה</span>;
    const v = variants.find(variant => variant.v_id === vId);
    if (!v) return `וריאציה #${vId}`;
    const prod = products.find(p => p.p_id === v.p_id);
    return `${prod?.p_name || 'Product'} [${v.v_size} / ${v.v_color}]`;
  };

  const resolveCampaignName = (cId: number) => {
    const c = campaigns.find(camp => camp.campaign_id === cId);
    return c ? c.campaign_name : `קמפיין #${cId}`;
  };

  const resolveDirectorName = (dId: number) => {
    const d = directors.find(dir => dir.director_id === dId);
    return d ? d.director_name.split(' (')[0] : `מנהל #${dId}`;
  };

  const resolveStockOrderDetails = (orderId: number) => {
    const o = stockOrders.find(ord => ord.order_id === orderId);
    if (!o) return `הזמנה #${orderId}`;
    const supName = suppliers.find(s => s.s_id === o.s_id)?.s_name || `ספק #${o.s_id}`;
    return `${o.order_date} (${supName})`;
  };

  // Prepopulate Update when user inputs or selects Key
  const handlePreloadFromKey = (idVal: string) => {
    setSelectedKeyForPreload(idVal);
    const idNum = Number(idVal);
    if (!idVal || isNaN(idNum)) return;

    let foundRecord: any = null;
    switch (activeTable) {
      case 'categories': foundRecord = categories.find(c => c.c_id === idNum); break;
      case 'suppliers': foundRecord = suppliers.find(s => s.s_id === idNum); break;
      case 'warehouses': foundRecord = warehouses.find(w => w.w_id === idNum); break;
      case 'products': foundRecord = products.find(p => p.p_id === idNum); break;
      case 'variants': foundRecord = variants.find(v => v.v_id === idNum); break;
      case 'stock_orders': foundRecord = stockOrders.find(o => o.order_id === idNum); break;
      case 'order_items': foundRecord = orderItems.find(i => i.item_id === idNum); break;
      case 'directors': foundRecord = directors.find(d => d.director_id === idNum); break;
      case 'campaigns': foundRecord = campaigns.find(c => c.campaign_id === idNum); break;
      case 'promotions': foundRecord = promotions.find(p => p.promo_id === idNum); break;
    }

    if (foundRecord) {
      setFormsState({ ...foundRecord });
      setErrorAlert(null);
    } else {
      setFormsState({});
      setErrorAlert('מפתח לא נמצא בבסיס הנתונים');
    }
  };

  // Triggers checking on INSERT and UPDATE
  const checkTriggersAndConstraints = (table: DatabaseTable, data: any, isNew: boolean): { isValid: boolean; updatedData: any; errorMsg?: string } => {
    // 1. Core General constraints
    if (table === 'suppliers') {
      if (!data.s_name || !data.s_email) {
        return { isValid: false, updatedData: data, errorMsg: 'שם ספק ואימייל הם שדות חובה!' };
      }
      if (!data.s_email.includes('@')) {
        return { isValid: false, updatedData: data, errorMsg: 'שגיאת אילוץ CHECK: כתובת אימייל חייבת להכיל את התו @' };
      }
    }

    if (table === 'products') {
      const price = Number(data.p_price);
      if (isNaN(price) || price <= 0) {
        return { isValid: false, updatedData: data, errorMsg: 'שגיאת אילוץ CHECK: מחיר מוצר חייב להיות גדול מ-0!' };
      }
    }

    if (table === 'warehouses') {
      const cap = Number(data.capacity);
      if (isNaN(cap) || cap < 0) {
        return { isValid: false, updatedData: data, errorMsg: 'שגיאת אילוץ CHECK: תפוסת מחסן אינה יכולה להיות שלילית!' };
      }
    }

    if (table === 'variants') {
      const g = Number(data.quantity_on_hand);
      if (isNaN(g) || g < 0) {
        return { isValid: false, updatedData: data, errorMsg: 'שגיאת אילוץ CHECK: כמות המלאי אינה יכולה להיות שלילית!' };
      }
    }

    // 2. Trigger 1 (trg_log_stock_movement) - After Update Variant
    if (table === 'variants' && !isNew) {
      const oldVar = variants.find(v => v.v_id === Number(data.v_id));
      const oldQty = oldVar ? Number(oldVar.quantity_on_hand) : null;
      const newQty = Number(data.quantity_on_hand);
      
      if (oldQty !== null && oldQty !== newQty) {
        const diff = newQty - oldQty;
        let action = diff > 0 
          ? `STOCK_INCREASE: Received ${diff} units.`
          : `STOCK_DECREASE: Distributed ${Math.abs(diff)} units.`;
        
        if (newQty < 10) {
          action += ` WARNING: Stock dropped below limit (${newQty}).`;
        }
        
        // Trigger fires!
        addStockLog(Number(data.v_id), oldQty, newQty, action);
      }
    }

    // 3. Trigger 2 (trg_enforce_campaign_budget_policy) - Before Insert or Update Campaigns
    if (table === 'campaigns') {
      const budget = Number(data.budget);
      if (budget < 0) {
        return { isValid: false, updatedData: data, errorMsg: 'שגיאת חוק: תקציב קמפיין לא יכול להיות שלילי!' };
      }

      const director = directors.find(d => d.director_id === Number(data.director_id));
      if (director) {
        const maxAllowed = Number(director.annual_budget) * 0.50; // 50% limit policy
        if (budget > maxAllowed) {
          const violationMsg = `POL-VIOLATION: Budget ${budget} violates the 50% cap of director budget (${maxAllowed}).`;
          
          // Budget cap is enforced! We write logs and cap the budget dynamically as defined in Trigger 2 PL/pgSQL
          addViolationLog(Number(data.campaign_id), budget, maxAllowed, violationMsg);
          
          // Mutate budget to max allowed
          data.budget = Math.round(maxAllowed);
          
          showSuccess(`🚨 התרעת טריגר 2: תקציב הקמפיין חרג מ-50% מתקציב המנהל והוגבל אוטומטית ל-₪${maxAllowed.toLocaleString()}`);
        }
      }
    }

    return { isValid: true, updatedData: data };
  };

  // Perform INSERT
  const handleInsertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pkField = getPKName(activeTable);
    const pkValue = Number(formsState[pkField]);

    if (!pkValue || isNaN(pkValue)) {
      setErrorAlert('אנא הזן מפתח ראשי תקין (מספר)!');
      return;
    }

    // Check unique key constraint
    const isDuplicate = checkDuplicatePK(activeTable, pkValue);
    if (isDuplicate) {
      setErrorAlert(`שגיאת מפתח קיימת: מפתח ID ${pkValue} כבר שמור בטבלה זו!`);
      return;
    }

    // Validate triggers and constraints before inserting
    const checkResult = checkTriggersAndConstraints(activeTable, { ...formsState }, true);
    if (!checkResult.isValid) {
      setErrorAlert(checkResult.errorMsg || 'שגיאת אימות נתונים');
      return;
    }

    const finalData = checkResult.updatedData;

    // Insert into state
    switch (activeTable) {
      case 'categories': setCategories([...categories, finalData as StoreCategory]); break;
      case 'suppliers': setSuppliers([...suppliers, finalData as StoreSupplier]); break;
      case 'warehouses': setWarehouses([...warehouses, finalData as StoreWarehouse]); break;
      case 'products': setProducts([...products, finalData as StoreProduct]); break;
      case 'variants': setVariants([...variants, finalData as StoreProductVariant]); break;
      case 'stock_orders': setStockOrders([...stockOrders, finalData as StoreStockOrder]); break;
      case 'order_items': setOrderItems([...orderItems, finalData as StoreOrderItem]); break;
      case 'directors': setDirectors([...directors, finalData as MarketingDirector]); break;
      case 'campaigns': setCampaigns([...campaigns, { ...finalData, campaign_efficiency_score: 0 } as AdvertisingCampaign]); break;
      case 'promotions': setPromotions([...promotions, finalData as Promotion]); break;
    }

    showSuccess('הרשומה התווספה בהצלחה לבסיס הנתונים!');
    resetForm();
  };

  // Perform UPDATE
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pkField = getPKName(activeTable);
    const pkValue = Number(formsState[pkField]);

    if (!pkValue || isNaN(pkValue)) {
      setErrorAlert('לא נבחר מפתח קצה תקין לעריכה');
      return;
    }

    // Check constraints & trigger side-effects
    const checkResult = checkTriggersAndConstraints(activeTable, { ...formsState }, false);
    if (!checkResult.isValid) {
      setErrorAlert(checkResult.errorMsg || 'שגיאת אימות נתונים');
      return;
    }

    const finalData = checkResult.updatedData;

    // Save update
    switch (activeTable) {
      case 'categories': setCategories(categories.map(c => c.c_id === pkValue ? finalData as StoreCategory : c)); break;
      case 'suppliers': setSuppliers(suppliers.map(s => s.s_id === pkValue ? finalData as StoreSupplier : s)); break;
      case 'warehouses': setWarehouses(warehouses.map(w => w.w_id === pkValue ? finalData as StoreWarehouse : w)); break;
      case 'products': setProducts(products.map(p => p.p_id === pkValue ? finalData as StoreProduct : p)); break;
      case 'variants': setVariants(variants.map(v => v.v_id === pkValue ? finalData as StoreProductVariant : v)); break;
      case 'stock_orders': setStockOrders(stockOrders.map(o => o.order_id === pkValue ? finalData as StoreStockOrder : o)); break;
      case 'order_items': setOrderItems(orderItems.map(i => i.item_id === pkValue ? finalData as StoreOrderItem : i)); break;
      case 'directors': setDirectors(directors.map(d => d.director_id === pkValue ? finalData as MarketingDirector : d)); break;
      case 'campaigns': setCampaigns(campaigns.map(c => c.campaign_id === pkValue ? finalData as AdvertisingCampaign : c)); break;
      case 'promotions': setPromotions(promotions.map(p => p.promo_id === pkValue ? finalData as Promotion : p)); break;
    }

    showSuccess('הרשומה עודכנה בהצלחה בבסיס הנתונים!');
    resetForm();
  };

  // Perform Delete with Cascade / Set Null emulation logic
  const handleDeleteRow = (id: number) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הרשומה עם מפתח ${id}?\nשים לב: מחיקה זו מדמה מנגנוני אכיפת מפתחות זרים כפי שהוגדר ב-PostgreSQL!`)) return;

    switch (activeTable) {
      case 'categories':
        // store_products: ON DELETE SET NULL for c_id
        setCategories(categories.filter(c => c.c_id !== id));
        setProducts(products.map(p => p.c_id === id ? { ...p, c_id: null } : p));
        showSuccess(`הקטגוריה נמחקה. כל המוצרים שתחתיה עודכנו ל-c_id = NULL (אומת ON DELETE SET NULL)`);
        break;
      
      case 'products':
        // store_product_variants: CASCADE deletes variants using this Product
        setProducts(products.filter(p => p.p_id !== id));
        const matchedVariants = variants.filter(v => v.p_id === id);
        const variantIds = matchedVariants.map(v => v.v_id);
        
        setVariants(variants.filter(v => v.p_id !== id));
        setOrderItems(orderItems.filter(item => !variantIds.includes(item.v_id)));
        showSuccess(`המוצר נמחק. כל ${matchedVariants.length} הווריאציות המקושרות אליו נמחקו אוטומטית (אומת ON DELETE CASCADE)`);
        break;

      case 'variants':
        setVariants(variants.filter(v => v.v_id !== id));
        setOrderItems(orderItems.filter(item => item.v_id !== id));
        setPromotions(promotions.map(p => p.product_variant_id === id ? { ...p, product_variant_id: null } : p));
        showSuccess(`וריאציית המלאי נמחקה בהצלחה.`);
        break;

      case 'suppliers':
        setSuppliers(suppliers.filter(s => s.s_id !== id));
        setCampaigns(campaigns.map(c => c.supplier_id === id ? { ...c, supplier_id: null } : c));
        setStockOrders(stockOrders.map(o => o.s_id === id ? { ...o, s_id: 50 } : o)); // Fallback or clear
        showSuccess(`הספק נמחק.`);
        break;

      case 'warehouses':
        setWarehouses(warehouses.filter(w => w.w_id !== id));
        // Fallback for variants using this warehouse
        setVariants(variants.map(v => v.w_id === id ? { ...v, w_id: 100 } : v));
        showSuccess(`המחסן נמחק.`);
        break;

      case 'stock_orders':
        // order_items: ON DELETE CASCADE
        setStockOrders(stockOrders.filter(o => o.order_id !== id));
        setOrderItems(orderItems.filter(item => item.order_id !== id));
        showSuccess(`הזמנת רכש נמחקה. כל פריטי הרכש המקושרים נמחקו אוטומטית (ON DELETE CASCADE)`);
        break;

      case 'order_items':
        setOrderItems(orderItems.filter(item => item.item_id !== id));
        showSuccess('פריט הרכש נמחק בהצלחה.');
        break;

      case 'directors':
        setDirectors(directors.filter(d => d.director_id !== id));
        setCampaigns(campaigns.filter(c => c.director_id !== id));
        showSuccess('מנהלי שיווק נמחקו. הקמפיינים שתחתיהם הוסרו.');
        break;

      case 'campaigns':
        setCampaigns(campaigns.filter(c => c.campaign_id !== id));
        setPromotions(promotions.filter(p => p.campaign_id !== id));
        showSuccess('הקמפיין נמחק בהצלחה.');
        break;

      case 'promotions':
        setPromotions(promotions.filter(p => p.promo_id !== id));
        showSuccess('מבצע הנחה הוסר בהצלחה.');
        break;
    }
  };

  // Helper getters
  const getPKName = (table: DatabaseTable): string => {
    switch (table) {
      case 'categories': return 'c_id';
      case 'suppliers': return 's_id';
      case 'warehouses': return 'w_id';
      case 'products': return 'p_id';
      case 'variants': return 'v_id';
      case 'stock_orders': return 'order_id';
      case 'order_items': return 'item_id';
      case 'directors': return 'director_id';
      case 'campaigns': return 'campaign_id';
      case 'promotions': return 'promo_id';
    }
  };

  const checkDuplicatePK = (table: DatabaseTable, val: number): boolean => {
    switch (table) {
      case 'categories': return categories.some(c => c.c_id === val);
      case 'suppliers': return suppliers.some(s => s.s_id === val);
      case 'warehouses': return warehouses.some(w => w.w_id === val);
      case 'products': return products.some(p => p.p_id === val);
      case 'variants': return variants.some(v => v.v_id === val);
      case 'stock_orders': return stockOrders.some(o => o.order_id === val);
      case 'order_items': return orderItems.some(i => i.item_id === val);
      case 'directors': return directors.some(d => d.director_id === val);
      case 'campaigns': return campaigns.some(c => c.campaign_id === val);
      case 'promotions': return promotions.some(p => p.promo_id === val);
    }
  };

  // Active dataset filtering
  const getActiveDataset = (): any[] => {
    switch (activeTable) {
      case 'categories': return categories;
      case 'suppliers': return suppliers;
      case 'warehouses': return warehouses;
      case 'products': return products;
      case 'variants': return variants;
      case 'stock_orders': return stockOrders;
      case 'order_items': return orderItems;
      case 'directors': return directors;
      case 'campaigns': return campaigns;
      case 'promotions': return promotions;
    }
  };

  const filteredDataset = getActiveDataset().filter(item => {
    const stringified = JSON.stringify(item).toLowerCase();
    return stringified.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Visual Header Grid & Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Table Selector bar */}
        <div className="md:col-span-1 space-y-1.5 border-l border-slate-100 pl-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">טבלאות בסיס הנתונים (10)</h3>
          <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
            {tablesList.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTable(tab.id);
                  resetForm();
                }}
                className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                  activeTable === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTable === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Console List Panel */}
        <div className="md:col-span-3 space-y-4">
          
          {/* Action alerts */}
          {successAlert && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-emerald-800 text-xs animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successAlert}</span>
            </div>
          )}

          {errorAlert && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-800 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorAlert}</span>
              <button onClick={() => setErrorAlert(null)} className="mr-auto text-rose-400 hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Bar controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="חיפוש חופשי ברשומות..."
                className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  resetForm();
                  setIsInsertMode(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                הוסף רשומה חדשה
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setIsUpdateMode(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
                title="עדכון מבוסס קוד מפתח"
              >
                <Edit className="w-4 h-4" />
                עדכון לפי מפתח
              </button>
            </div>
          </div>

          {/* DYNAMIC FORMS PANEL */}
          {(isInsertMode || isUpdateMode) && (
            <div className="bg-amber-50/20 border border-amber-200/60 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Edit className="w-4 h-4 text-amber-500" />
                  {isInsertMode ? 'יצירת רשומה חדשה במערכת (Smart Insert)' : 'עדכון רשומה מבוססת קוד מפתח (Fetch & Update)'}
                </h4>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Requirement: בזמן עדכון - המשתמש ימלא את המפתח והמערכת תביא את יתר השדות */}
              {isUpdateMode && !formsState[getPKName(activeTable)] && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
                  <span className="text-xs font-semibold text-amber-800 block">בחר קוד מפתח ראשי לאחזור הנתונים (PK Selection):</span>
                  <div className="flex gap-2">
                    <select
                      value={selectedKeyForPreload}
                      onChange={e => handlePreloadFromKey(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="">-- בחר מפתח ראשי --</option>
                      {getActiveDataset().map(item => {
                        const pkField = getPKName(activeTable);
                        const labelValue = pkField === 'products' ? (item as StoreProduct).p_name : 
                                           pkField === 'variants' ? `${(item as StoreProductVariant).v_size} / ${(item as StoreProductVariant).v_color}` :
                                           pkField === 'campaigns' ? (item as AdvertisingCampaign).campaign_name : item[pkField];
                        return (
                          <option key={item[pkField]} value={item[pkField]}>
                            ID {item[pkField]} ({labelValue})
                          </option>
                        );
                      })}
                    </select>
                    
                    <input
                      type="number"
                      placeholder="או הקלד ידנית את קוד ה-ID"
                      value={selectedKeyForPreload}
                      onChange={e => handlePreloadFromKey(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs w-48 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* RENDER SMART INPUT FIELDS */}
              {(isInsertMode || (isUpdateMode && formsState[getPKName(activeTable)])) && (
                <form onSubmit={isInsertMode ? handleInsertSubmit : handleUpdateSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Key - Locked in edit mode */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">מפתח ראשי ({getPKName(activeTable)}) *</label>
                    <input
                      type="number"
                      disabled={isUpdateMode}
                      value={formsState[getPKName(activeTable)] || ''}
                      onChange={e => setFormsState({ ...formsState, [getPKName(activeTable)]: Number(e.target.value) })}
                      required
                      placeholder="לדוגמא 501"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  {/* Render fields dynamically based on activeTable */}
                  {activeTable === 'categories' && (
                    <div className="space-y-1 col-span-1">
                      <label className="text-xs font-bold text-slate-500 block">שם הקטגוריה</label>
                      <input
                        type="text"
                        value={formsState.c_name || ''}
                        onChange={e => setFormsState({ ...formsState, c_name: e.target.value })}
                        required
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {activeTable === 'suppliers' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">שם ספק *</label>
                        <input
                          type="text"
                          value={formsState.s_name || ''}
                          onChange={e => setFormsState({ ...formsState, s_name: e.target.value })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">כתובת</label>
                        <input
                          type="text"
                          value={formsState.s_address || ''}
                          onChange={e => setFormsState({ ...formsState, s_address: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">כתובת אימייל (חייב להכיל @) *</label>
                        <input
                          type="text"
                          value={formsState.s_email || ''}
                          onChange={e => setFormsState({ ...formsState, s_email: e.target.value })}
                          required
                          placeholder="test@example.com"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">טלפון</label>
                        <input
                          type="text"
                          value={formsState.s_phone || ''}
                          onChange={e => setFormsState({ ...formsState, s_phone: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {activeTable === 'warehouses' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">מיקום המחסן</label>
                        <input
                          type="text"
                          value={formsState.w_location || ''}
                          onChange={e => setFormsState({ ...formsState, w_location: e.target.value })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">תפוסת מקסימום (Capacity) *</label>
                        <input
                          type="number"
                          value={formsState.capacity ?? ''}
                          onChange={e => setFormsState({ ...formsState, capacity: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">שם מנהל המחסן</label>
                        <input
                          type="text"
                          value={formsState.manager_name || ''}
                          onChange={e => setFormsState({ ...formsState, manager_name: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">טלפון</label>
                        <input
                          type="text"
                          value={formsState.w_phone || ''}
                          onChange={e => setFormsState({ ...formsState, w_phone: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {activeTable === 'products' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">שם המוצר *</label>
                        <input
                          type="text"
                          value={formsState.p_name || ''}
                          onChange={e => setFormsState({ ...formsState, p_name: e.target.value })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">שם מותג והחברה</label>
                        <input
                          type="text"
                          value={formsState.p_brand || ''}
                          onChange={e => setFormsState({ ...formsState, p_brand: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">מחיר לצרכן ש"ח *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formsState.p_price ?? ''}
                          onChange={e => setFormsState({ ...formsState, p_price: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">בחר קטגוריה (מפתח זר חכם) *</label>
                        <select
                          value={formsState.c_id ?? ''}
                          onChange={e => setFormsState({ ...formsState, c_id: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- ללא קטגוריה --</option>
                          {categories.map(c => (
                            <option key={c.c_id} value={c.c_id}>{c.c_name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {activeTable === 'variants' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">מידה (Size)</label>
                        <input
                          type="text"
                          value={formsState.v_size || ''}
                          onChange={e => setFormsState({ ...formsState, v_size: e.target.value })}
                          placeholder="M, S, L, XL"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">צבע (Color)</label>
                        <input
                          type="text"
                          value={formsState.v_color || ''}
                          onChange={e => setFormsState({ ...formsState, v_color: e.target.value })}
                          placeholder="Black, White"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">מלאי פיזי זמין (Quantity On Hand) *</label>
                        <input
                          type="number"
                          value={formsState.quantity_on_hand ?? ''}
                          onChange={e => setFormsState({ ...formsState, quantity_on_hand: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">קשר למוצר אב *</label>
                        <select
                          value={formsState.p_id ?? ''}
                          onChange={e => setFormsState({ ...formsState, p_id: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- בחר מוצר --</option>
                          {products.map(p => (
                            <option key={p.p_id} value={p.p_id}>{p.p_name} ({p.p_brand})</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">איזה מחסן משויך *</label>
                        <select
                          value={formsState.w_id ?? ''}
                          onChange={e => setFormsState({ ...formsState, w_id: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- בחר מחסן --</option>
                          {warehouses.map(w => (
                            <option key={w.w_id} value={w.w_id}>{w.w_location}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {activeTable === 'stock_orders' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">תאריך ההזמנה *</label>
                        <input
                          type="date"
                          value={formsState.order_date || ''}
                          onChange={e => setFormsState({ ...formsState, order_date: e.target.value })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">סטטוס הזמנה</label>
                        <select
                          value={formsState.order_status || 'Pending'}
                          onChange={e => setFormsState({ ...formsState, order_status: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="Pending">Pending (ממתין)</option>
                          <option value="Approved & Inbound">Approved (מאושר בדרך)</option>
                          <option value="Restock Draft">Restock Draft (טיוטה)</option>
                          <option value="Cancelled">Cancelled (בוטל)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">סכום כולל (Total Amount)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formsState.total_amount ?? ''}
                          onChange={e => setFormsState({ ...formsState, total_amount: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">ספק מזמין *</label>
                        <select
                          value={formsState.s_id ?? ''}
                          onChange={e => setFormsState({ ...formsState, s_id: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- בחר ספק --</option>
                          {suppliers.map(s => (
                            <option key={s.s_id} value={s.s_id}>{s.s_name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {activeTable === 'order_items' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">עלות קנייה ליחידה *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formsState.unit_cost ?? ''}
                          onChange={e => setFormsState({ ...formsState, unit_cost: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">כמות רכישה *</label>
                        <input
                          type="number"
                          value={formsState.quantity ?? ''}
                          onChange={e => setFormsState({ ...formsState, quantity: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">שיבוץ להזמנת רכש *</label>
                        <select
                          value={formsState.order_id ?? ''}
                          onChange={e => setFormsState({ ...formsState, order_id: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- בחר הזמנה --</option>
                          {stockOrders.map(o => (
                            <option key={o.order_id} value={o.order_id}>{resolveStockOrderDetails(o.order_id)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">עבור איזה וריאציה *</label>
                        <select
                          value={formsState.v_id ?? ''}
                          onChange={e => setFormsState({ ...formsState, v_id: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- בחר וריאציה --</option>
                          {variants.map(v => (
                            <option key={v.v_id} value={v.v_id}>{resolveVariantName(v.v_id)}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {activeTable === 'directors' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">שם המנהל *</label>
                        <input
                          type="text"
                          value={formsState.director_name || ''}
                          onChange={e => setFormsState({ ...formsState, director_name: e.target.value })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">תקציב שנתי מאושר ש"ח *</label>
                        <input
                          type="number"
                          value={formsState.annual_budget ?? ''}
                          onChange={e => setFormsState({ ...formsState, annual_budget: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">סוג אסטרטגיה</label>
                        <input
                          type="text"
                          value={formsState.strategy_type || ''}
                          onChange={e => setFormsState({ ...formsState, strategy_type: e.target.value })}
                          placeholder="Performance, Branding"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {activeTable === 'campaigns' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">שם הקמפיין השיווקי *</label>
                        <input
                          type="text"
                          value={formsState.campaign_name || ''}
                          onChange={e => setFormsState({ ...formsState, campaign_name: e.target.value })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">תקציב מבוקש ש"ח (כפוף לטריגר ספי הגנה) *</label>
                        <input
                          type="number"
                          value={formsState.budget ?? ''}
                          onChange={e => setFormsState({ ...formsState, budget: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">מנהל אחראי (מפתח זר) *</label>
                        <select
                          value={formsState.director_id ?? ''}
                          onChange={e => setFormsState({ ...formsState, director_id: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- בחר מנהל --</option>
                          {directors.map(d => (
                            <option key={d.director_id} value={d.director_id}>{d.director_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">ספק חונך / ספונסר</label>
                        <select
                          value={formsState.supplier_id ?? ''}
                          onChange={e => setFormsState({ ...formsState, supplier_id: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- ללא חסות --</option>
                          {suppliers.map(s => (
                            <option key={s.s_id} value={s.s_id}>{s.s_name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {activeTable === 'promotions' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">שם קוד המבצע *</label>
                        <input
                          type="text"
                          value={formsState.promo_name || ''}
                          onChange={e => setFormsState({ ...formsState, promo_name: e.target.value })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">אחוז ההנחה (%) *</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formsState.discount_percent ?? ''}
                          onChange={e => setFormsState({ ...formsState, discount_percent: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">תחת איזה קמפיין *</label>
                        <select
                          value={formsState.campaign_id ?? ''}
                          onChange={e => setFormsState({ ...formsState, campaign_id: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- בחר קמפיין --</option>
                          {campaigns.map(c => (
                            <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">אפיין פריט במבצע (מפתח זר)</label>
                        <select
                          value={formsState.product_variant_id ?? ''}
                          onChange={e => setFormsState({ ...formsState, product_variant_id: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- ללא פריט ספציפי --</option>
                          {variants.map(v => (
                            <option key={v.v_id} value={v.v_id}>{resolveVariantName(v.v_id)}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Buttons */}
                  <div className="col-span-1 sm:col-span-2 pt-2 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold transition-all"
                    >
                      ביטול
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      {isInsertMode ? 'בצע הוספה (Insert)' : 'שמור שינויים (Save Update)'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TABLE DISPLAY - EXCLUDING RAW ID TO SHOW TEXT LABELS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
            {filteredDataset.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <FolderMinus className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-medium text-xs">לא נמצאו רשומות רלוונטיות לפילוח החיפוש.</p>
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                  <tr>
                    {/* Primary Key Headers */}
                    <th className="px-5 py-3 font-mono">מפתח קוד (ID)</th>
                    
                    {/* Context Fields Headers dynamically rendered to omit raw FK IDs */}
                    {activeTable === 'categories' && <th className="px-5 py-3">שם הקטגוריה המורחב</th>}
                    
                    {activeTable === 'suppliers' && (
                      <>
                        <th className="px-4 py-3">שם ספק קצה</th>
                        <th className="px-4 py-3">כתובת</th>
                        <th className="px-4 py-3">אימייל</th>
                        <th className="px-4 py-3">טלפון</th>
                      </>
                    )}

                    {activeTable === 'warehouses' && (
                      <>
                        <th className="px-4 py-3">מיקום לוגיסטי</th>
                        <th className="px-4 py-3 font-mono">תפוסה מקסימלית</th>
                        <th className="px-4 py-3">מנהל אחראי</th>
                        <th className="px-4 py-3">מספר טלפון פנימי</th>
                      </>
                    )}

                    {activeTable === 'products' && (
                      <>
                        <th className="px-4 py-3">תיאור מוצר</th>
                        <th className="px-4 py-3">מותג יצרן</th>
                        <th className="px-4 py-3 font-mono">מחיר לצרכן</th>
                        <th className="px-4 py-3">קטגוריית אב (שם במקום ID)</th>
                      </>
                    )}

                    {activeTable === 'variants' && (
                      <>
                        <th className="px-4 py-3">שם המוצר (שם במקום ID)</th>
                        <th className="px-4 py-3">מידה קולקטיבית</th>
                        <th className="px-4 py-3">צבע פריט</th>
                        <th className="px-4 py-3 font-mono">מלאי פיזי נוכחי</th>
                        <th className="px-4 py-3">מחסון פיזי משויך</th>
                      </>
                    )}

                    {activeTable === 'stock_orders' && (
                      <>
                        <th className="px-4 py-3">תאריך הוצאה</th>
                        <th className="px-4 py-3 text-center">סטטוס תפעולי</th>
                        <th className="px-4 py-3 font-mono">סכום הזמנה כולל</th>
                        <th className="px-4 py-3">ספק ראשי (שם במקום ID)</th>
                      </>
                    )}

                    {activeTable === 'order_items' && (
                      <>
                        <th className="px-4 py-3">עלות קנייה</th>
                        <th className="px-4 py-3 font-mono">כמות מוזמנת</th>
                        <th className="px-4 py-3">משויך להזמנת אב</th>
                        <th className="px-4 py-3">וריאציית פריט (שם במקום ID)</th>
                      </>
                    )}

                    {activeTable === 'directors' && (
                      <>
                        <th className="px-4 py-3">שם מנהל</th>
                        <th className="px-4 py-3 font-mono">תקציב שנתי מאושר</th>
                        <th className="px-4 py-3">סוג אסטרטגיה מובילה</th>
                      </>
                    )}

                    {activeTable === 'campaigns' && (
                      <>
                        <th className="px-4 py-3">שם הקמפיין</th>
                        <th className="px-4 py-3 font-mono">תקציב קמפיין סופי</th>
                        <th className="px-4 py-3">עמידות איכות במדד ROI</th>
                        <th className="px-4 py-3">מנהל אחראי (שם במקום ID)</th>
                        <th className="px-4 py-3">ספק מעניק חסות</th>
                      </>
                    )}

                    {activeTable === 'promotions' && (
                      <>
                        <th className="px-4 py-3">שם המבצע</th>
                        <th className="px-4 py-3 font-mono">אחוז הנחה</th>
                        <th className="px-4 py-3">שם הקמפיין המשויך (שם במקום ID)</th>
                        <th className="px-4 py-3">פריט ספציפי מקושר (שם במקום ID)</th>
                      </>
                    )}

                    <th className="px-5 py-3 text-center">פעולות עריכה/מחיקה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDataset.map((item, index) => {
                    const pkField = getPKName(activeTable);
                    const pkValue = item[pkField];

                    return (
                      <tr key={pkValue} className="hover:bg-slate-50 transition-all">
                        {/* Primary Key Value */}
                        <td className="px-5 py-3 font-mono font-bold text-slate-900">ID #{pkValue}</td>
                        
                        {/* Dynamic cell matching columns */}
                        {activeTable === 'categories' && (
                          <td className="px-5 py-3 font-medium">{item.c_name}</td>
                        )}

                        {activeTable === 'suppliers' && (
                          <>
                            <td className="px-4 py-3 font-medium">{item.s_name}</td>
                            <td className="px-4 py-3 text-slate-500">{item.s_address}</td>
                            <td className="px-4 py-3 font-mono text-slate-500">{item.s_email}</td>
                            <td className="px-4 py-3 text-slate-400">{item.s_phone}</td>
                          </>
                        )}

                        {activeTable === 'warehouses' && (
                          <>
                            <td className="px-4 py-3 font-medium">{item.w_location}</td>
                            <td className="px-4 py-3 font-mono text-slate-700 font-bold">{Number(item.capacity).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-600">{item.manager_name}</td>
                            <td className="px-4 py-3 text-slate-400">{item.w_phone}</td>
                          </>
                        )}

                        {activeTable === 'products' && (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-800">{item.p_name}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">{item.p_brand}</span></td>
                            <td className="px-4 py-3 font-mono text-slate-900 font-bold">₪{Number(item.p_price).toLocaleString()}</td>
                            {/* Joins and resolves category name instead of raw numerical category_id */}
                            <td className="px-4 py-3 text-slate-600 font-medium">{resolveCategoryName(item.c_id)}</td>
                          </>
                        )}

                        {activeTable === 'variants' && (
                          <>
                            {/* Joins and resolves product name and brand instead of raw p_id */}
                            <td className="px-4 py-3 font-medium text-slate-800">{resolveProductName(item.p_id)}</td>
                            <td className="px-4 py-3 text-slate-500">{item.v_size}</td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: item.v_color.toLowerCase() }} />
                                {item.v_color}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                Number(item.quantity_on_hand) < 10 
                                  ? 'bg-amber-100 text-amber-800 animate-pulse' 
                                  : 'bg-emerald-50 text-emerald-800'
                              }`}>
                                {item.quantity_on_hand} יח'
                              </span>
                            </td>
                            {/* Resolves warehouse location name instead of raw w_id */}
                            <td className="px-4 py-3 text-slate-600 font-medium">{resolveWarehouseLocation(item.w_id)}</td>
                          </>
                        )}

                        {activeTable === 'stock_orders' && (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-500">{item.order_date}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.order_status === 'Approved & Inbound' ? 'bg-emerald-100 text-emerald-800' :
                                item.order_status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {item.order_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-900 font-bold">₪{Number(item.total_amount).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{resolveSupplierName(item.s_id)}</td>
                          </>
                        )}

                        {activeTable === 'order_items' && (
                          <>
                            <td className="px-4 py-3 font-mono text-slate-900 font-medium">₪{Number(item.unit_cost).toLocaleString()}</td>
                            <td className="px-4 py-3 font-mono text-slate-600 font-bold">{item.quantity} יח'</td>
                            <td className="px-4 py-3 font-mono text-slate-500">{resolveStockOrderDetails(item.order_id)}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">{resolveVariantName(item.v_id)}</td>
                          </>
                        )}

                        {activeTable === 'directors' && (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-900">{item.director_name}</td>
                            <td className="px-4 py-3 font-mono text-slate-700 font-bold">₪{Number(item.annual_budget).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-500">{item.strategy_type}</td>
                          </>
                        )}

                        {activeTable === 'campaigns' && (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-800">{item.campaign_name}</td>
                            <td className="px-4 py-3 font-mono text-slate-900 font-bold">₪{Number(item.budget).toLocaleString()}</td>
                            <td className="px-4 py-3 font-mono">
                              <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                                {Number(item.campaign_efficiency_score).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{resolveDirectorName(item.director_id)}</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{resolveSupplierName(item.supplier_id)}</td>
                          </>
                        )}

                        {activeTable === 'promotions' && (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-800">{item.promo_name}</td>
                            <td className="px-4 py-3 font-mono text-slate-900 font-bold">{item.discount_percent}% הנחה</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{resolveCampaignName(item.campaign_id)}</td>
                            <td className="px-4 py-3 font-medium text-slate-500">{resolveVariantName(item.product_variant_id)}</td>
                          </>
                        )}

                        {/* ROW ACTIONS */}
                        <td className="px-5 py-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => {
                                resetForm();
                                handlePreloadFromKey(String(pkValue));
                                setIsUpdateMode(true);
                              }}
                              className="p-1 px-2 border border-amber-300 text-amber-700 hover:bg-amber-100 rounded-md transition-colors"
                              title="ערוך ועדכן רשומה"
                            >
                              ערוך
                            </button>
                            <button
                              onClick={() => handleDeleteRow(Number(pkValue))}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="מחק שורה עם השפעת אילוצי מפתחות"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
