import { 
  Database, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Activity, 
  DollarSign, 
  ShieldAlert, 
  Clock,
  ArrowDownRight,
  ArrowUpRight
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

interface DashboardProps {
  categories: StoreCategory[];
  suppliers: StoreSupplier[];
  warehouses: StoreWarehouse[];
  products: StoreProduct[];
  variants: StoreProductVariant[];
  campaigns: AdvertisingCampaign[];
  directors: MarketingDirector[];
  stockLogs: StockAuditLog[];
  violations: BudgetViolationLog[];
}

export default function Dashboard({
  categories,
  suppliers,
  warehouses,
  products,
  variants,
  campaigns,
  directors,
  stockLogs,
  violations
}: DashboardProps) {
  
  // Calculations
  const totalProducts = products.length;
  const lowStockThreshold = 10;
  const lowStockVariants = variants.filter(v => v.quantity_on_hand < lowStockThreshold);
  const totalCampaigns = campaigns.length;
  
  const totalMarketingBudget = campaigns.reduce((acc, c) => acc + Number(c.budget), 0);
  const totalDirectorBudgets = directors.reduce((acc, d) => acc + Number(d.annual_budget), 0);

  // Helper helper function to resolve Variant name
  const getVariantName = (vId: number) => {
    const variant = variants.find(v => v.v_id === vId);
    if (!variant) return `Variant #${vId}`;
    const product = products.find(p => p.p_id === variant.p_id);
    return `${product?.p_name || 'Product'} (${variant.v_size} / ${variant.v_color})`;
  };

  // Helper to resolve Campaign name
  const getCampaignName = (cId: number) => {
    return campaigns.find(c => c.campaign_id === cId)?.campaign_name || `קמפיין #${cId}`;
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Products */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">פריטים וקטגוריות</span>
            <span className="text-3xl font-bold text-slate-800 tracking-tight mt-1 inline-block">{totalProducts}</span>
            <span className="text-xs text-slate-500 block mt-1">ב-{categories.length} קטגוריות שונות</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={`p-6 rounded-2xl border transition-all flex items-center justify-between ${
          lowStockVariants.length > 0 
            ? 'bg-amber-50/50 border-amber-200 hover:shadow-md' 
            : 'bg-white border-slate-200 hover:shadow-md'
        }`}>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">התרעות חוסר מלאי</span>
            <span className={`text-3xl font-bold tracking-tight mt-1 inline-block ${
              lowStockVariants.length > 0 ? 'text-amber-600' : 'text-slate-800'
            }`}>
              {lowStockVariants.length}
            </span>
            <span className="text-xs text-slate-500 block mt-1">
              {lowStockVariants.length > 0 ? 'פריטים מתחת ל-10 יחידות!' : 'המלאי תקין במלואו'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            lowStockVariants.length > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Total campaigns budget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">תקציב קמפיינים פעיל</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight mt-1 inline-block">
              ₪{totalMarketingBudget.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 block mt-1">מתוך ₪{totalDirectorBudgets.toLocaleString()} מאושר</span>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Efficiency index */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">קמפיינים פעילים</span>
            <span className="text-3xl font-bold text-slate-800 tracking-tight mt-1 inline-block">{totalCampaigns}</span>
            <span className="text-xs text-slate-500 block mt-1">מנוהלים על ידי {directors.length} מנהלים</span>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Row of Graphics and Quick Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Warehouse Storage Usage Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            תפוסת מחסנים פיזיים (Capacity Usage)
          </h3>
          <div className="space-y-4">
            {warehouses.map(w => {
              // Calculate sum of variants inside this warehouse
              const currentStock = variants
                .filter(v => v.w_id === w.w_id)
                .reduce((acc, v) => acc + Number(v.quantity_on_hand), 0);
              const percentage = Math.min(Math.round((currentStock / Number(w.capacity)) * 100), 100);
              
              return (
                <div key={w.w_id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{w.w_location.split(' - ')[0]}</span>
                    <span className="text-slate-500 font-mono">{currentStock} / {w.capacity} יח' ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentage > 85 ? 'bg-rose-500' : percentage > 50 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Low Stock Actions */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">פריטים בחוסר קריטי (מתחת ל-10)</h4>
            {lowStockVariants.length === 0 ? (
              <p className="text-xs text-green-600 font-medium">✨ אין פריטים בחוסר! מלאי החנות מושלם.</p>
            ) : (
              <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                {lowStockVariants.map(v => (
                  <div key={v.v_id} className="flex justify-between items-center text-xs p-2 rounded bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="text-slate-700 font-medium">{getVariantName(v.v_id)}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold font-mono">
                      {v.quantity_on_hand} יח'
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Audit Log (Trigger 1: store_stock_audit_log) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              לוג תנועות מלאי וטריגרים (`store_stock_audit_log`)
            </h3>
            <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
              {stockLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">לא תועדו תנועות מלאי עדיין.</p>
              ) : (
                stockLogs.slice().reverse().map(log => (
                  <div key={log.log_id} className="p-3 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl border border-indigo-100/50 transition-all text-xs">
                    <div className="flex justify-between items-center mb-1 text-slate-400">
                      <span className="font-mono font-bold text-indigo-600">ID #{log.log_id}</span>
                      <span className="text-[10px]">{log.change_date}</span>
                    </div>
                    <p className="font-medium text-slate-700 mb-1">
                      <strong>פריט:</strong> {getVariantName(log.v_id)}
                    </p>
                    <p className="text-slate-600 leading-relaxed bg-white/70 p-1.5 rounded border border-indigo-50">
                      {log.action_taken}
                    </p>
                    <div className="flex gap-2 mt-1 text-[10px] font-mono justify-end text-slate-500">
                      <span>מלאי ישן: {log.old_quantity ?? 'NULL'}</span>
                      <span>←</span>
                      <span className="font-bold text-indigo-700">מלאי חדש: {log.new_quantity}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Budget Enforcement Violations (Trigger 2: campaign_budget_violations_log) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-rose-700 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              לוג חריגות תקציב שיווק (`campaign_budget_violations_log`)
            </h3>
            <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
              {violations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-green-600 font-medium">🔒 מדיניות התקציבים מחוזקת היטב</p>
                  <p className="text-[11px] text-slate-400 mt-1">אין חריגות מעל 50% מתקציב מנהל השנה</p>
                </div>
              ) : (
                violations.slice().reverse().map(violation => (
                  <div key={violation.violation_id} className="p-3 bg-rose-50/40 hover:bg-rose-50/80 rounded-xl border border-rose-100 transition-all text-xs">
                    <div className="flex justify-between items-center mb-1 text-rose-500">
                      <span className="font-mono font-bold text-rose-700">חריגה #{violation.violation_id}</span>
                      <span className="text-[10px] text-slate-400">{violation.violation_date}</span>
                    </div>
                    <p className="font-medium text-slate-700 mb-1">
                      <strong>קמפיין:</strong> {getCampaignName(violation.campaign_id)}
                    </p>
                    <p className="text-xs text-rose-800 leading-relaxed bg-white/80 p-2 rounded border border-rose-100 font-mono">
                      {violation.user_alert}
                    </p>
                    <div className="flex gap-2 mt-1.5 text-[10px] font-mono justify-end text-slate-500">
                      <span>בוקש: ₪{violation.attempted_budget.toLocaleString()}</span>
                      <span>|</span>
                      <span className="font-bold text-rose-700">תקרה מותרת: ₪{violation.max_allowed_budget.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Quick reminder */}
          <div className="mt-4 bg-slate-50 rounded-xl p-3 text-slate-500 text-[11px] leading-relaxed">
            💡 <strong>חוק תקציב קמפיין:</strong> טריגר 2 אוכף אוטומטית שקמפיין יחיד לא יעבור את ה-50% מהתקציב השנתי הכולל של המנהל שלו. כל חריגה נבלמת והתקציב מקויל לתקרה מיידית.
          </div>
        </div>

      </div>
    </div>
  );
}
