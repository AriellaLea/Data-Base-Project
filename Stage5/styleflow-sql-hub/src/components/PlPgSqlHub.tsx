import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  HelpCircle, 
  Maximize2, 
  CheckCircle, 
  Settings,
  FlameKindling
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

interface PlPgSqlHubProps {
  warehouses: StoreWarehouse[];
  suppliers: StoreSupplier[];
  products: StoreProduct[];
  variants: StoreProductVariant[];
  stockOrders: StoreStockOrder[];
  orderItems: StoreOrderItem[];
  directors: MarketingDirector[];
  campaigns: AdvertisingCampaign[];
  promotions: Promotion[];
  setVariants: React.Dispatch<React.SetStateAction<StoreProductVariant[]>>;
  setStockOrders: React.Dispatch<React.SetStateAction<StoreStockOrder[]>>;
  setOrderItems: React.Dispatch<React.SetStateAction<StoreOrderItem[]>>;
  setCampaigns: React.Dispatch<React.SetStateAction<AdvertisingCampaign[]>>;
  addStockLog: (vId: number, oldQ: number | null, newQ: number, action: string) => void;
  addViolationLog: (campaignId: number, attempted: number, maxAllowed: number, alertMsg: string) => void;
}

type Subprogram = 'restock' | 'adjust_budget' | 'efficiency' | 'refcursor_report';

export default function PlPgSqlHub({
  warehouses, suppliers, products, variants, stockOrders, orderItems, directors, campaigns, promotions,
  setVariants, setStockOrders, setOrderItems, setCampaigns, addStockLog, addViolationLog
}: PlPgSqlHubProps) {

  const [activeSub, setActiveSub] = useState<Subprogram>('restock');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'PostgreSQL Database System connected.',
    'System ready to compile and run subprograms.'
  ]);
  const [isRunning, setIsRunning] = useState(false);

  // Form params
  const [restockWarehouse, setRestockWarehouse] = useState<number>(100);
  const [restockMin, setRestockMin] = useState<number>(10);
  const [restockQty, setRestockQty] = useState<number>(50);

  const [budgetDirector, setBudgetDirector] = useState<number>(1);
  const [budgetMaxCap, setBudgetMaxCap] = useState<number>(250000);

  const [effCampaign, setEffCampaign] = useState<number>(1);
  const [reportSupplier, setReportSupplier] = useState<number>(50);

  // Ref Cursor Dynamic Result State
  const [cursorReportData, setCursorReportData] = useState<any[] | null>(null);

  // Subprogram detail dictionary
  const subProgramsList = [
    { id: 'restock', title: 'Procedure sp_process_warehouse_restock', desc: 'פרוצדורת רענון מלאי במחסן. סורקת פריטים שמתחת למינימום, ורוכשת מהספק. מפעילה את טריגר 1 למעקב תנועות מלאי ומדפיסה הודעות שרת.', type: 'פרוצדורה (Procedure)' },
    { id: 'adjust_budget', title: 'Procedure sp_adjust_campaign_budgets', desc: 'פרוצדורת ייעול תקציבי שיווק. מעדכנת את תקציבי הקמפיינים המקורבים אצל מנהל מסוים, מוודאת תקרות הגנה ומפעילה את טריגר 2.', type: 'פרוצדורה (Procedure)' },
    { id: 'efficiency', title: 'Function fn_calculate_campaign_efficiency', desc: 'פונקציה המחשבת מדד ROI משוקלל לקמפיין שיווקי. מחלצת הנחות ומלאים קיימים, מעדכנת בטבלה ומחזירה ציון יעילות כלכלי.', type: 'פונקציה (Function)' },
    { id: 'refcursor_report', title: 'Function fn_get_supplier_order_report', desc: 'פונקציה מתקדמת המחזירה מצביע REFCURSOR מבוסס. פותחת ומנתבת מצביע, ומדפיסה דוח רכש מורחב של ספק קצה.', type: 'פונקציה (Ref Cursor)' },
  ];

  const clearConsole = () => {
    setConsoleLogs(['Console logs cleared. Ready...']);
    setCursorReportData(null);
  };

  const getVariantSummary = (vId: number) => {
    const v = variants.find(variant => variant.v_id === vId);
    if (!v) return `Variant #${vId}`;
    const p = products.find(prod => prod.p_id === v.p_id);
    return `${p?.p_name} (${v.v_size} / ${v.v_color}) (${p?.p_brand})`;
  };

  // Run sp_process_warehouse_restock
  const runRestockProcedure = () => {
    setIsRunning(true);
    setCursorReportData(null);
    const logs: string[] = [];
    
    logs.push(`LOG: CALL sp_process_warehouse_restock(p_warehouse_id := ${restockWarehouse}, p_min_stock := ${restockMin}, p_order_quantity := ${restockQty});`);
    logs.push(`NOTICE:  --- פתיחת סריקת מלאים במחסן #${restockWarehouse} ---`);

    // Find variants under this warehouse and below min stock
    const lowStock = variants.filter(v => v.w_id === restockWarehouse && Number(v.quantity_on_hand) < restockMin);
    
    if (lowStock.length === 0) {
      logs.push(`NOTICE:  לא נמצאו פריטים מתחת לרף המינימום המוגדר (${restockMin} יח'). הפרוצדורה הסתיימה.`);
      setConsoleLogs([...consoleLogs, ...logs]);
      setIsRunning(false);
      return;
    }

    logs.push(`NOTICE:  נמצאו ${lowStock.length} וריאציות התחת לרף המינימום!`);
    
    // Create Stock Order in state
    const newOrderId = Math.max(...stockOrders.map(o => o.order_id), 2000) + 1;
    const sId = 50; // Fashion Group Inc
    logs.push(`NOTICE:  מנפיק הזמנת רכש חדשה מול ספק #50 (Fashion Group Inc) - הזמנה ID #${newOrderId}`);

    let totalAmount = 0;
    const newOrderItems: StoreOrderItem[] = [];
    let currentItemId = Math.max(...orderItems.map(i => i.item_id), 3000);

    // Map modifications to variants
    const updatedVariants = variants.map(v => {
      const match = lowStock.find(ls => ls.v_id === v.v_id);
      if (match) {
        currentItemId += 1;
        const prod = products.find(p => p.p_id === v.p_id);
        const originalPrice = prod ? Number(prod.p_price) : 100;
        const unitCost = Math.round(originalPrice * 0.60); // purchasing cost (60%)
        const itemCost = unitCost * restockQty;
        
        totalAmount += itemCost;

        newOrderItems.push({
          item_id: currentItemId,
          unit_cost: unitCost,
          quantity: restockQty,
          order_id: newOrderId,
          v_id: v.v_id
        });

        // Trigger trg_log_stock_movement logs creation
        const oldQty = Number(v.quantity_on_hand);
        const newQty = oldQty + restockQty;
        const action = `STOCK_INCREASE: Received ${restockQty} units via sp_process_warehouse_restock in warehouse #${restockWarehouse}`;
        
        // Push log in a timeout or function
        addStockLog(v.v_id, oldQty, newQty, action);

        logs.push(`NOTICE:  פריט: "${prod?.p_name || 'מוצר'}" [${v.v_size} / ${v.v_color}]. עלות קנייה: ₪${unitCost}. הכמות תווסף למלאי.`);
        logs.push(`TRIGGER EXECUTED: trg_log_stock_movement רשם לוג ב-store_stock_audit_log. מלאי: ${oldQty} ← ${newQty}`);

        return {
          ...v,
          quantity_on_hand: newQty
        };
      }
      return v;
    });

    // Stock Order inserting
    const newOrder: StoreStockOrder = {
      order_id: newOrderId,
      order_date: new Date().toISOString().split('T')[0],
      order_status: 'Approved & Inbound',
      total_amount: totalAmount,
      s_id: sId
    };

    // DB state mutations
    setVariants(updatedVariants);
    setStockOrders([...stockOrders, newOrder]);
    setOrderItems([...orderItems, ...newOrderItems]);

    logs.push(`NOTICE:  הזמנת רכש #${newOrderId} הושלמה ואושרה במערכת. עלות הזמנה סופית: ₪${totalAmount.toLocaleString()}`);
    logs.push(`LOG: CALL COMPLETED SUCCESSFULLY.`);

    setTimeout(() => {
      setConsoleLogs([...consoleLogs, ...logs]);
      setIsRunning(false);
    }, 800);
  };

  // Run sp_adjust_campaign_budgets
  const runAdjustBudgetsProcedure = () => {
    setIsRunning(true);
    setCursorReportData(null);
    const logs: string[] = [];

    logs.push(`LOG: CALL sp_adjust_campaign_budgets(p_director_id := ${budgetDirector}, p_max_budget_allowed := ${budgetMaxCap});`);
    logs.push(`NOTICE:  --- תחילת אופטימיזציית תקציבי קמפיינים למנהל #${budgetDirector} ---`);

    const dirCamps = campaigns.filter(c => c.director_id === budgetDirector);

    if (dirCamps.length === 0) {
      logs.push(`NOTICE:  לא נמצאו קמפיינים שיווקיים תחת מנהל זה.`);
      setConsoleLogs([...consoleLogs, ...logs]);
      setIsRunning(false);
      return;
    }

    const director = directors.find(d => d.director_id === budgetDirector);
    const dirName = director ? director.director_name.split(' (')[0] : `מנהל #${budgetDirector}`;
    logs.push(`NOTICE:  מנהל: ${dirName}. תקציב שנתי זמין: ₪${Number(director?.annual_budget).toLocaleString()}`);

    // Adjust camps budget
    let isModified = false;
    const updatedCampaigns = campaigns.map(c => {
      if (c.director_id === budgetDirector) {
        isModified = true;
        // Mock platform expenditures (let's assume expenditures is 85% of budget)
        const platformSpend = Math.round(Number(c.budget) * 0.82);
        logs.push(`NOTICE:  ניתוח קמפיין: "${c.campaign_name}" (ID #${c.campaign_id}). תקציב נוכחי: ₪${Number(c.budget).toLocaleString()}. הוצאות פלטפורמות: ₪${platformSpend.toLocaleString()}`);

        let suggestedBudget = Number(c.budget);

        if (platformSpend >= Number(c.budget) * 0.80) {
          // Increase budget because spent is high
          suggestedBudget = Math.round(Number(c.budget) * 1.25);
          logs.push(`NOTICE:  הוצאות המדיה קרובות לתקציב (מעל 80%). סכום תקציב חדש מוצע: ₪${suggestedBudget.toLocaleString()}`);
          
          // Enforce cap input param
          if (suggestedBudget > budgetMaxCap) {
            suggestedBudget = budgetMaxCap;
            logs.push(`NOTICE:  תקציב מוצע עובר את המגבלה הידנית שהוכנסה במערכת (₪${budgetMaxCap.toLocaleString()}). ממתן לתקרה.`);
          }

          // Trigger 2 check
          const annualLimit = Number(director?.annual_budget) * 0.50;
          if (suggestedBudget > annualLimit) {
            const violationMsg = `POL-VIOLATION: Budget ${suggestedBudget} violates the 50% cap of director budget (${annualLimit}).`;
            suggestedBudget = Math.round(annualLimit);
            
            // Log trigger
            addViolationLog(c.campaign_id, suggestedBudget, annualLimit, violationMsg);
            logs.push(`TRIGGER EXECUTED: trg_enforce_campaign_budget_policy זיהה חריגה של מעל 50% מתקציב מנהל אב! תקציב ננעל על תקרת ה-₪${annualLimit.toLocaleString()}`);
          }
        } else if (platformSpend < Number(c.budget) * 0.40 && Number(c.budget) > 10000) {
          // Downsize budget
          suggestedBudget = Math.round(Number(c.budget) * 0.90);
          logs.push(`NOTICE:  הוצאות נמוכות מ-40% מתקציב הקמפיין. התקציב יצומצם ב-10% לצורך חיסכון. תקציב חדש: ₪${suggestedBudget.toLocaleString()}`);
        } else {
          logs.push(`NOTICE:  תקציב ממוצע מאוזן. לא נדרש שינוי.`);
        }

        return {
          ...c,
          budget: suggestedBudget
        };
      }
      return c;
    });

    if (isModified) {
      setCampaigns(updatedCampaigns);
    }

    logs.push(`NOTICE:  סיום אופטימיזציה לסנכרון תקציב שיווק.`);
    logs.push(`LOG: CALL COMPLETED SUCCESSFULLY.`);

    setTimeout(() => {
      setConsoleLogs([...consoleLogs, ...logs]);
      setIsRunning(false);
    }, 800);
  };

  // Run fn_calculate_campaign_efficiency
  const runEfficiencyFunction = () => {
    setIsRunning(true);
    setCursorReportData(null);
    const logs: string[] = [];

    logs.push(`LOG: SELECT fn_calculate_campaign_efficiency(p_campaign_id := ${effCampaign});`);
    logs.push(`NOTICE:  --- חישוב מדד יעילות לקמפיין שיווקי #${effCampaign} ---`);

    const camp = campaigns.find(c => c.campaign_id === effCampaign);
    if (!camp) {
      logs.push(`NOTICE:  קמפיין לא נמצא.`);
      setConsoleLogs([...consoleLogs, ...logs]);
      setIsRunning(false);
      return;
    }

    logs.push(`NOTICE:  שם הקמפיין: "${camp.campaign_name}". תקציב פנימי: ₪${Number(camp.budget).toLocaleString()}`);
    
    // Find promos in campaign
    const campPromos = promotions.filter(p => p.campaign_id === effCampaign);
    logs.push(`NOTICE:  נמצאו ${campPromos.length} מבצעים מקושרים לקמפיין בקשר מ-N.`);

    let totalPromotedStock = 0;
    let weightedDiscount = 0;

    campPromos.forEach(promo => {
      if (promo.product_variant_id) {
        const variant = variants.find(v => v.v_id === promo.product_variant_id);
        if (variant) {
          const qty = Number(variant.quantity_on_hand);
          totalPromotedStock += qty;
          weightedDiscount += qty * (Number(promo.discount_percent) / 100.0);
          logs.push(`NOTICE:  מבצע: "${promo.promo_name}". הנחה: ${promo.discount_percent}%. מלאי פריט זמין: ${qty} יח'.`);
        }
      }
    });

    // Compute efficiency index formula (Triggering PL/pgSQL maths)
    let score = 0;
    const investment = Number(camp.budget);
    
    if (investment > 0 && totalPromotedStock > 0) {
      // score formula
      score = Math.min(((weightedDiscount * 1000.0) / investment) * 100, 999.99);
      score = Math.round(score * 100) / 100; // 2 decimal digits
    }

    logs.push(`NOTICE:  נוסחת שקלול כלכלית-לוגיסטית: (הנחה משוקללת [${weightedDiscount.toFixed(2)}] * 100,000) / סך ההשקעה [₪${investment.toLocaleString()}]`);
    logs.push(`NOTICE:  דירוג יעילות שחושב לקמפיין: ${score.toFixed(2)} %`);

    // DML Update in DB representation
    const updatedCamps = campaigns.map(c => {
      if (c.campaign_id === effCampaign) {
        return {
          ...c,
          campaign_efficiency_score: score
        };
      }
      return c;
    });

    setCampaigns(updatedCamps);
    logs.push(`NOTICE:  הרצה פקודת DML UPDATE לעדכון עמודת campaign_efficiency_score בטבלה advertising_campaigns.`);
    logs.push(`LOG: RETURN RESULT: ${score.toFixed(2)}`);

    setTimeout(() => {
      setConsoleLogs([...consoleLogs, ...logs]);
      setIsRunning(false);
    }, 800);
  };

  // Run fn_get_supplier_order_report (Returning ref cursor)
  const runSupplierReportCursor = () => {
    setIsRunning(true);
    const logs: string[] = [];

    logs.push(`LOG: SELECT fn_get_supplier_order_report(p_supplier_id := ${reportSupplier}, p_cursor_name := 'supplier_report_cursor');`);
    logs.push(`NOTICE:  וידוא קיום ספק במערכת...`);

    const supplierExist = suppliers.find(s => s.s_id === reportSupplier);
    if (!supplierExist) {
      logs.push(`ERROR:  Supplier with ID ${reportSupplier} not found in database.`);
      setConsoleLogs([...consoleLogs, ...logs]);
      setIsRunning(false);
      return;
    }

    logs.push(`NOTICE:  הספק "${supplierExist.s_name}" אותר בהצלחה! מנתב ומכייל מצביע REFCURSOR.`);
    logs.push(`NOTICE:  פתיחת Explicit Cursor לחיבור הזמנות, מוצרים, וריאציות סינון ומיון מחירים...`);

    // Filter stock orders from supplier
    const supOrders = stockOrders.filter(o => o.s_id === reportSupplier);
    const matchedItems: any[] = [];

    supOrders.forEach(o => {
      const items = orderItems.filter(i => i.order_id === o.order_id);
      items.forEach(item => {
        const variant = variants.find(v => v.v_id === item.v_id);
        if (variant) {
          const prod = products.find(p => p.p_id === variant.p_id);
          matchedItems.push({
            order_id: o.order_id,
            order_date: o.order_date,
            order_status: o.order_status,
            total_amount: o.total_amount,
            item_id: item.item_id,
            unit_cost: item.unit_cost,
            quantity: item.quantity,
            v_size: variant.v_size,
            v_color: variant.v_color,
            p_name: prod?.p_name || 'מוצר',
            p_brand: prod?.p_brand || 'מותג'
          });
        }
      });
    });

    logs.push(`NOTICE:  נפרסו ${matchedItems.length} שורות רכש במצביע.`);
    logs.push(`LOG: RETURNING REFCURSOR "supplier_report_cursor" BOUND TO TARGET ROWS.`);

    setTimeout(() => {
      setConsoleLogs([...consoleLogs, ...logs]);
      setCursorReportData(matchedItems);
      setIsRunning(false);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Selector layout & controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left selector */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">תת-תוכניות PL/pgSQL שלב ד'</h3>
            <div className="space-y-1.5">
              {subProgramsList.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setActiveSub(sub.id as Subprogram);
                    setCursorReportData(null);
                  }}
                  className={`w-full text-right p-3 rounded-xl block border transition-all ${
                    activeSub === sub.id
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900 select-none'
                      : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-xs">{sub.title.split(' ')[1]}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{sub.type}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters box */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 tracking-wider flex items-center gap-1">
              <Settings className="w-4 h-4 text-indigo-500" />
              פרמטרים לקריאה (In-Parameters)
            </h3>

            {/* Params restock */}
            {activeSub === 'restock' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">מחסן תפעולי לבדיקה</label>
                  <select
                    value={restockWarehouse}
                    onChange={e => setRestockWarehouse(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {warehouses.map(w => (
                      <option key={w.w_id} value={w.w_id}>{w.w_location}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">סף מלאי קריטי (Threshold)</label>
                  <input
                    type="number"
                    value={restockMin}
                    onChange={e => setRestockMin(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">כמות שינוי מלאי (Restock Qty)</label>
                  <input
                    type="number"
                    value={restockQty}
                    onChange={e => setRestockQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <button
                  onClick={runRestockProcedure}
                  disabled={isRunning}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4" />
                  קרא לפרוצדורה (Call)
                </button>
              </div>
            )}

            {/* Params adjust budget */}
            {activeSub === 'adjust_budget' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">בחר מנהל שיווק לבקרה</label>
                  <select
                    value={budgetDirector}
                    onChange={e => setBudgetDirector(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {directors.map(dir => (
                      <option key={dir.director_id} value={dir.director_id}>{dir.director_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">תקרת תקציב קמפיין מקסימלית</label>
                  <input
                    type="number"
                    value={budgetMaxCap}
                    onChange={e => setBudgetMaxCap(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <button
                  onClick={runAdjustBudgetsProcedure}
                  disabled={isRunning}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4" />
                  קרא לפרוצדורה (Call)
                </button>
              </div>
            )}

            {/* Params efficiency */}
            {activeSub === 'efficiency' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">בחר קמפיין לחישוב יעילות</label>
                  <select
                    value={effCampaign}
                    onChange={e => setEffCampaign(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {campaigns.map(camp => (
                      <option key={camp.campaign_id} value={camp.campaign_id}>{camp.campaign_name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={runEfficiencyFunction}
                  disabled={isRunning}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <FlameKindling className="w-4 h-4" />
                  הפעל פונקציה (Execute)
                </button>
              </div>
            )}

            {/* Params ref cursor suppliers */}
            {activeSub === 'refcursor_report' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">שלוף דוח עבור ספק</label>
                  <select
                    value={reportSupplier}
                    onChange={e => setReportSupplier(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {suppliers.map(sup => (
                      <option key={sup.s_id} value={sup.s_id}>{sup.s_name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={runSupplierReportCursor}
                  disabled={isRunning}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Terminal className="w-4 h-4" />
                  טען מצביע רכש (Ref Cursor)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right terminal logs */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex-1 flex flex-col">
            <div className="px-4 py-2.5 bg-slate-800 border-b border-slate-950 flex justify-between items-center text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-[10px] text-green-400">
                <Terminal className="w-3.5 h-3.5" />
                POSTGRESQL DB ENGINE TERMINAL
              </span>
              <button onClick={clearConsole} className="hover:text-white font-semibold text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded">
                Clear log
              </button>
            </div>
            
            <div className="p-4 font-mono text-[10px] text-cyan-400 bg-slate-900 overflow-y-auto max-h-[340px] flex-1 flex flex-col justify-end">
              <div className="space-y-1 max-h-full">
                {consoleLogs.map((log, index) => {
                  let logClass = 'text-cyan-400';
                  if (log.startsWith('NOTICE:')) logClass = 'text-yellow-400 font-semibold';
                  if (log.startsWith('TRIGGER')) logClass = 'text-rose-400 font-bold';
                  if (log.startsWith('LOG: COMPLETED')) logClass = 'text-emerald-400 font-bold';
                  if (log.startsWith('ERROR:')) logClass = 'text-rose-500 font-bold';

                  return (
                    <div key={index} className={`leading-relaxed ${logClass}`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-slate-500 text-[11px] leading-relaxed">
            💡 <strong>השפעה חיה על מסד הנתונים:</strong> השינויים שתפעילו כאן, לדוגמא רענון המלאי או עדכון התקציבים, יעדכנו את הנתונים <strong>בזמן אמת</strong> בטבלאות ותראו זאת במסך ה-CRUD ובדשבורד הראשי!
          </div>
        </div>

      </div>

      {/* RENDER CURSOR DATA TABLES */}
      {cursorReportData && (
        <div className="bg-white p-5 border border-slate-200/80 rounded-2xl space-y-3 animate-slideUp">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            תוצאות שהוחזרו ממצביע הרכש (`Ref Cursor supplier_report_cursor`)
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            הפלט שלפניך חולץ מתוך לולאת ה-FETCH של המצביע הדינמי המריץ שאילתת חיבור ספקים והזמנות רכש מרובות:
          </p>

          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2 font-mono">פריט ID</th>
                <th className="px-4 py-2">שם מוצר</th>
                <th className="px-4 py-2">מותג</th>
                <th className="px-4 py-2">מידה & צבע</th>
                <th className="px-4 py-2 font-mono text-center">כמות מוזמנת</th>
                <th className="px-4 py-2 font-mono">עלות ליחידה</th>
                <th className="px-4 py-2 font-mono">מספר הזמנה</th>
                <th className="px-4 py-2 text-center">סטטוס הזמנה</th>
                <th className="px-4 py-2">תאריך הזמנה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {cursorReportData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-slate-400 italic">לא נמצאו הזמנות רכש עבור ספק זה</td>
                </tr>
              ) : (
                cursorReportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 font-mono">#{row.item_id}</td>
                    <td className="px-4 py-2 font-bold">{row.p_name}</td>
                    <td className="px-4 py-2">{row.p_brand}</td>
                    <td className="px-4 py-2">{row.v_size} / {row.v_color}</td>
                    <td className="px-4 py-2 text-center font-bold">{row.quantity} יח'</td>
                    <td className="px-4 py-2 font-mono text-slate-900 font-medium">₪{row.unit_cost}</td>
                    <td className="px-4 py-2 font-mono font-bold">#{row.order_id}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.order_status === 'Approved & Inbound' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {row.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-500 font-mono">{row.order_date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
