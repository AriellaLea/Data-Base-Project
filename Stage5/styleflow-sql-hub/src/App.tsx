import { useState } from 'react';
import { 
  Database, 
  Activity, 
  Table, 
  Cpu, 
  SearchCode, 
  BookOpen, 
  Download,
  Terminal,
  Heart
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
} from './types';

import {
  initialCategories,
  initialSuppliers,
  initialWarehouses,
  initialProducts,
  initialVariants,
  initialStockOrders,
  initialOrderItems,
  initialDirectors,
  initialCampaigns,
  initialPromotions,
  initialStockLogs,
  initialBudgetViolations
} from './data';

import Dashboard from './components/Dashboard';
import CrudConsole from './components/CrudConsole';
import PlPgSqlHub from './components/PlPgSqlHub';
import QueriesViews from './components/QueriesViews';
import Guide from './components/Guide';

type Tab = 'dashboard' | 'crud' | 'plpgsql' | 'queries' | 'guide';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Centralized state representing our live PostgreSQL Relational database
  const [categories, setCategories] = useState<StoreCategory[]>(initialCategories);
  const [suppliers, setSuppliers] = useState<StoreSupplier[]>(initialSuppliers);
  const [warehouses, setWarehouses] = useState<StoreWarehouse[]>(initialWarehouses);
  const [products, setProducts] = useState<StoreProduct[]>(initialProducts);
  const [variants, setVariants] = useState<StoreProductVariant[]>(initialVariants);
  const [stockOrders, setStockOrders] = useState<StoreStockOrder[]>(initialStockOrders);
  const [orderItems, setOrderItems] = useState<StoreOrderItem[]>(initialOrderItems);
  const [directors, setDirectors] = useState<MarketingDirector[]>(initialDirectors);
  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>(initialCampaigns);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);

  // Simulated audit tables (updated in real-time by trigger handlers!)
  const [stockLogs, setStockLogs] = useState<StockAuditLog[]>(initialStockLogs);
  const [violations, setViolations] = useState<BudgetViolationLog[]>(initialBudgetViolations);

  // Trigger emulators
  const addStockLog = (vId: number, oldQ: number | null, newQ: number, action: string) => {
    const newLogId = Math.max(...stockLogs.map(l => l.log_id), 50000) + 1;
    const newLog: StockAuditLog = {
      log_id: newLogId,
      v_id: vId,
      old_quantity: oldQ,
      new_quantity: newQ,
      action_taken: action,
      change_date: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setStockLogs(prev => [...prev, newLog]);
  };

  const addViolationLog = (campaignId: number, attempted: number, maxAllowed: number, alertMsg: string) => {
    const newViolationId = Math.max(...violations.map(v => v.violation_id), 60000) + 1;
    const newViolation: BudgetViolationLog = {
      violation_id: newViolationId,
      campaign_id: campaignId,
      attempted_budget: attempted,
      max_allowed_budget: maxAllowed,
      violation_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_alert: alertMsg
    };
    setViolations(prev => [...prev, newViolation]);
  };

  const tabs: { id: Tab; label: string; icon: any; desc: string }[] = [
    { id: 'dashboard', label: 'לוח בקרה פרויקט (Dashboard)', icon: Activity, desc: 'סיכום הנתונים הסטטיסטי, מלאים קריטיים, לוגי אבטחה והתרעות טריגרים פנימיים.' },
    { id: 'crud', label: 'מסכי CRUD וטבלאות', icon: Table, desc: 'קריאה, יצירה חכמה, עדכון מבוסס מפתח מאוכלס ומחיקות משורשרות (Joins מובנים ללא מזהי ID).' },
    { id: 'plpgsql', label: 'תוכניות PL/pgSQL שלב ד\'', icon: Cpu, desc: 'הרצת פרוצדורות חידוש מלאי, אופטימיזציית תקציבים, פונקציות ROI, ודוחות Ref Cursor עם פלט שרת.' },
    { id: 'queries', label: 'הרצת שאילתות ומבטים', icon: SearchCode, desc: 'הרצה מרוכזת של מבטי שלב ג\' ושאילתות שלב ב\' על גבי נתוני המערכת הנוכחיים.' },
    { id: 'guide', label: 'תיעוד ומדריך קבלה', icon: BookOpen, desc: 'מדריך בקרה ותשובות מפורטות לכל אחד מסעיפי העבודה המוגשים של שלב ה\'.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header Banner - High Polish */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-100">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-950 font-sans">StyleFlow Control Center</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">משולב שיווק ומלאי • שלב ה׳</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60" title="StyleFlow Marketing Hub & Clothing Store System Integration">
                Integrated 3NF DB
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                פעיל • Connected 
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Body - Split viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Menu Panel */}
          <aside className="lg:col-span-1 space-y-4" dir="rtl">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-2">תפריט ניווט ראשי</span>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all duration-200 text-right ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{tab.label.split(' (')[0]}</span>
                </button>
              ))}
            </div>

            {/* Quick overview widget */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-md">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-300">בסיס נתונים אירוח</h4>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                ממשק זה משמש כלוח פיקוח גרפי משוכלל המחובר ישירות לבסיס הנתונים המשולב.
              </p>
              <div className="mt-4 pt-4 border-t border-indigo-800/50 flex justify-between text-[10px] text-indigo-200 font-mono">
                <span>טבלאות: 10</span>
                <span>מבטים: 2</span>
                <span>טריגרים: 2</span>
              </div>
            </div>
          </aside>

          {/* Active Panel View */}
          <section className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              
              {/* Active Tab Page header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50" dir="rtl">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {tabs.find(t => t.id === activeTab)?.desc}
                  </p>
                </div>
              </div>

              {/* Dynamic Pages contents */}
              <div className="p-6 flex-1">
                {activeTab === 'dashboard' && (
                  <Dashboard
                    categories={categories}
                    suppliers={suppliers}
                    warehouses={warehouses}
                    products={products}
                    variants={variants}
                    campaigns={campaigns}
                    directors={directors}
                    stockLogs={stockLogs}
                    violations={violations}
                  />
                )}

                {activeTab === 'crud' && (
                  <CrudConsole
                    categories={categories}
                    suppliers={suppliers}
                    warehouses={warehouses}
                    products={products}
                    variants={variants}
                    stockOrders={stockOrders}
                    orderItems={orderItems}
                    directors={directors}
                    campaigns={campaigns}
                    promotions={promotions}
                    setCategories={setCategories}
                    setSuppliers={setSuppliers}
                    setWarehouses={setWarehouses}
                    setProducts={setProducts}
                    setVariants={setVariants}
                    setStockOrders={setStockOrders}
                    setOrderItems={setOrderItems}
                    setDirectors={setDirectors}
                    setCampaigns={setCampaigns}
                    setPromotions={setPromotions}
                    addStockLog={addStockLog}
                    addViolationLog={addViolationLog}
                  />
                )}

                {activeTab === 'plpgsql' && (
                  <PlPgSqlHub
                    warehouses={warehouses}
                    suppliers={suppliers}
                    products={products}
                    variants={variants}
                    stockOrders={stockOrders}
                    orderItems={orderItems}
                    directors={directors}
                    campaigns={campaigns}
                    promotions={promotions}
                    setVariants={setVariants}
                    setStockOrders={setStockOrders}
                    setOrderItems={setOrderItems}
                    setCampaigns={setCampaigns}
                    addStockLog={addStockLog}
                    addViolationLog={addViolationLog}
                  />
                )}

                {activeTab === 'queries' && (
                  <QueriesViews
                    categories={categories}
                    suppliers={suppliers}
                    warehouses={warehouses}
                    products={products}
                    variants={variants}
                    campaigns={campaigns}
                    directors={directors}
                    promotions={promotions}
                  />
                )}

                {activeTab === 'guide' && <Guide />}
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200/80 py-4 mt-12 text-center text-[10px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© 2026 StyleFlow SQL Hub Controls. All rights reserved.</span>
          <span className="flex items-center gap-1 font-semibold text-slate-500">
            Proudly coded for Database Project Stage 5 
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </span>
        </div>
      </footer>

    </div>
  );
}
