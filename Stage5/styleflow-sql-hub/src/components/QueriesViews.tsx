import { useState } from 'react';
import { 
  FileText, 
  Terminal, 
  Search, 
  HelpCircle, 
  ChevronRight, 
  Table
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
  Promotion
} from '../types';

interface QueriesViewsProps {
  categories: StoreCategory[];
  suppliers: StoreSupplier[];
  warehouses: StoreWarehouse[];
  products: StoreProduct[];
  variants: StoreProductVariant[];
  campaigns: AdvertisingCampaign[];
  directors: MarketingDirector[];
  promotions: Promotion[];
}

type QueryID = 
  | 'marketing_view' 
  | 'logistic_view' 
  | 'avg_price_view' 
  | 'lowest_variant' 
  | 'low_qty_grouped' 
  | 'campaign_efficiency_roi'
  | 'supplier_funding';

export default function QueriesViews({
  categories, suppliers, warehouses, products, variants, campaigns, directors, promotions
}: QueriesViewsProps) {

  const [activeQuery, setActiveQuery] = useState<QueryID>('marketing_view');

  const queriesList = [
    {
      id: 'marketing_view',
      title: 'מבט שיווקי: marketing_view',
      desc: 'מציג את כל מוצרי החנות שעלותם מעל 50 ש"ח וממיין אותם לעמודי סיווג פיננסי: פריטים שעלותם מעל 200 ש"ח מתועדים כ-"Luxury", השאר מתועדים כ-"Affordable".',
      sql: `CREATE OR REPLACE VIEW marketing_view AS
SELECT 
    p.p_id, p.p_name, p.p_brand, p.p_price, c.c_name,
    CASE 
        WHEN p.p_price >= 200 THEN 'Luxury / יוקרתי'
        ELSE 'Affordable / נגיש'
    END AS financial_tier
FROM store_products p
LEFT JOIN store_category c ON p.c_id = c.c_id
WHERE p.p_price >= 50.00;`
    },
    {
      id: 'logistic_view',
      title: 'מבט לוגיסטי: logistic_view',
      desc: 'מבט קריטי לאיתור וריאציות פריטים שכמות המלאי שלהן קטנה מ-10 יחידות, ומצרף את נתוני המחסן, המנהל, והמוצר.',
      sql: `CREATE OR REPLACE VIEW logistic_view AS
SELECT 
    v.v_id, p.p_name, p.p_brand, v.v_size, v.v_color, v.quantity_on_hand,
    w.w_location, w.manager_name,
    'RED ALERT - LOW STOCK' AS alert_status
FROM store_product_variants v
JOIN store_products p ON v.p_id = p.p_id
JOIN store_warehouses w ON v.w_id = w.w_id
WHERE v.quantity_on_hand < 10;`
    },
    {
      id: 'avg_price_view',
      title: 'שאילתא 1.2: ממוצע מחירי יוקרה (marketing_view)',
      desc: 'מריצה חישוב ממוצע מחירים (AVG) לקבוצת מוצרי ה-"Luxury" מתוך המבט השיווקי.',
      sql: `SELECT 
    financial_tier, 
    COUNT(*) AS total_items, 
    ROUND(AVG(p_price), 2) AS average_price
FROM marketing_view
WHERE financial_tier = 'Luxury / יוקרתי'
GROUP BY financial_tier;`
    },
    {
      id: 'lowest_variant',
      title: 'שאילתא 2.1: פריט בוריאציה הנמוכה ביותר (logistic_view)',
      desc: 'שולף את הרשומה היחידה ממבט הלוגיסטיקה שיש לה את המלאי הזמין הנמוך ביותר בבסיס הנתונים.',
      sql: `SELECT 
    v_id, p_name, p_brand, v_size, v_color, quantity_on_hand, w_location
FROM logistic_view
ORDER BY quantity_on_hand ASC
LIMIT 1;`
    },
    {
      id: 'low_qty_grouped',
      title: 'שאילתא 2.2: פילוח חוסרי מלאי לפי קטגוריות',
      desc: 'ספירה וקיבוץ (GROUP BY) של פריטים בחוסר מלאי קריטי ממבט הלוגיסטיקה, ממוינים לפי קטגוריית המוצר.',
      sql: `SELECT 
    c.c_name, 
    COUNT(lv.v_id) AS low_stock_variants_count
FROM logistic_view lv
JOIN store_products p ON lv.p_name = p.p_name
JOIN store_category c ON p.c_id = c.c_id
GROUP BY c.c_name
ORDER BY low_stock_variants_count DESC;`
    },
    {
      id: 'campaign_efficiency_roi',
      title: 'שאילתת שלב ב\': ניתוח קמפיינים ותפוקה תקציבית',
      desc: 'שאילתא מורכבת המחברת קמפיינים, מנהלים, מבצעים, ומדדי יעילות ROI.',
      sql: `SELECT 
    c.campaign_name, d.director_name, 
    c.budget, c.campaign_efficiency_score,
    COUNT(p.promo_id) AS promotions_count
FROM advertising_campaigns c
JOIN marketing_management d ON c.director_id = d.director_id
LEFT JOIN promotions p ON c.campaign_id = p.campaign_id
GROUP BY c.campaign_id, c.campaign_name, d.director_name, c.budget, c.campaign_efficiency_score
ORDER BY c.campaign_efficiency_score DESC;`
    },
    {
      id: 'supplier_funding',
      title: 'שאילתת שלב ב\': רואי חשבון ומימון ספקים',
      desc: 'מנתחת את חסויות הספקים והקמפיינים שהם מממנים עבור אגף השיווק של החנות.',
      sql: `SELECT 
    s.s_name, s.s_email, s.s_phone,
    COUNT(c.campaign_id) AS campaigns_sponsored,
    SUM(c.budget) AS total_sponsored_budget
FROM store_suppliers s
JOIN advertising_campaigns c ON s.s_id = c.supplier_id
GROUP BY s.s_id, s.s_name, s.s_email, s.s_phone;`
    }
  ];

  // SQL Execution Engine inside React State (Computing live results according to current DB state)
  const executeQuery = (): { headers: string[]; rows: any[] } => {
    switch (activeQuery) {
      case 'marketing_view': {
        const matching = products
          .filter(p => Number(p.p_price) >= 50.00)
          .map(p => {
            const catName = categories.find(c => c.c_id === p.c_id)?.c_name.split(' (')[0] || 'ללא קטגוריה';
            const tier = Number(p.p_price) >= 200 ? 'Luxury / יוקרתי' : 'Affordable / נגיש';
            return {
              p_id: p.p_id,
              p_name: p.p_name,
              p_brand: p.p_brand,
              p_price: `₪${Number(p.p_price).toLocaleString()}`,
              c_name: catName,
              financial_tier: tier
            };
          });
        return {
          headers: ['מפתח מוצר', 'שם מוצר', 'מותג', 'מחיר לצרכן', 'קטגוריה', 'סיווג פיננסי (financial_tier)'],
          rows: matching.map(o => [o.p_id, o.p_name, o.p_brand, o.p_price, o.c_name, o.financial_tier])
        };
      }

      case 'logistic_view': {
        const lowStock = variants
          .filter(v => Number(v.quantity_on_hand) < 10)
          .map(v => {
            const prod = products.find(p => p.p_id === v.p_id);
            const wh = warehouses.find(w => w.w_id === v.w_id);
            return {
              v_id: v.v_id,
              p_name: prod?.p_name || 'מוצר',
              p_brand: prod?.p_brand || 'מותג',
              v_size: v.v_size,
              v_color: v.v_color,
              qty: `${v.quantity_on_hand} יח'`,
              wh_location: wh?.w_location.split(' - ')[0] || `מחסן #${v.w_id}`,
              manager: wh?.manager_name || 'לא הוזן',
              alert_status: 'RED ALERT - ' + (Number(v.quantity_on_hand) < 5 ? 'CRITICAL' : 'LOW STOCK')
            };
          });
        return {
          headers: ['קוד וריאציה', 'שם מוצר', 'מותג', 'מידה', 'צבע', 'מלאי זמין', 'מחסן', 'מנהל מחסן', 'סטטוס התרעה (alert_status)'],
          rows: lowStock.map(o => [o.v_id, o.p_name, o.p_brand, o.v_size, o.v_color, o.qty, o.wh_location, o.manager, o.alert_status])
        };
      }

      case 'avg_price_view': {
        const luxuryProducts = products.filter(p => Number(p.p_price) >= 200.00);
        const count = luxuryProducts.length;
        const avg = count > 0 
          ? luxuryProducts.reduce((acc, p) => acc + Number(p.p_price), 0) / count
          : 0;
        return {
          headers: ['סיווג פיננסי (financial_tier)', 'סך פריטי יוקרה', 'ממוצע מחירים ש"ח (average_price)'],
          rows: [['Luxury / יוקרתי', `${count} מוצרים`, `₪${avg.toFixed(2)}`]]
        };
      }

      case 'lowest_variant': {
        const lowStock = variants
          .filter(v => Number(v.quantity_on_hand) < 10)
          .sort((a, b) => Number(a.quantity_on_hand) - Number(b.quantity_on_hand));
        
        if (lowStock.length === 0) {
          return { headers: ['תוצאה'], rows: [['לא נמצאו פריטים בחוסר מלאי']] };
        }
        
        const first = lowStock[0];
        const prod = products.find(p => p.p_id === first.p_id);
        const wh = warehouses.find(w => w.w_id === first.w_id);

        return {
          headers: ['קוד וריאציה', 'שם מוצר', 'מותג', 'מידה', 'צבע', 'מלאי זמין', 'שם המחסן (w_location)'],
          rows: [[
            first.v_id,
            prod?.p_name || 'מוצר',
            prod?.p_brand || 'מותג',
            first.v_size,
            first.v_color,
            `${first.quantity_on_hand} יח' (מינימלי בחנות!)`,
            wh?.w_location || ''
          ]]
        };
      }

      case 'low_qty_grouped': {
        // Find variants < 10
        const lowStock = variants.filter(v => Number(v.quantity_on_hand) < 10);
        // Map to counts grouped by Category name
        const groups: Record<string, number> = {};
        
        lowStock.forEach(v => {
          const prod = products.find(p => p.p_id === v.p_id);
          if (prod) {
            const cat = categories.find(c => c.c_id === prod.c_id);
            const catName = cat ? cat.c_name.split(' (')[0] : 'אחר';
            groups[catName] = (groups[catName] || 0) + 1;
          }
        });

        const rows = Object.entries(groups)
          .sort((a, b) => b[1] - a[1]) // highest count first
          .map(([name, count]) => [name, `${count} וריאציות בחוסר`]);

        return {
          headers: ['שם קטגוריית אב', 'סך וריאציות בחוסר קריטי (low_stock_variants_count)'],
          rows: rows.length > 0 ? rows : [['אין חוסרי מלאי כלשהם', '0']]
        };
      }

      case 'campaign_efficiency_roi': {
        const rows = campaigns.map(c => {
          const dir = directors.find(d => d.director_id === c.director_id);
          const dirName = dir ? dir.director_name.split(' (')[0] : `מנהל #${c.director_id}`;
          const promoCount = promotions.filter(p => p.campaign_id === c.campaign_id).length;
          return [
            c.campaign_name,
            dirName,
            `₪${Number(c.budget).toLocaleString()}`,
            `${Number(c.campaign_efficiency_score).toFixed(2)} %`,
            `${promoCount} מבצע לקוחות`
          ];
        }).sort((a, b) => {
          const scoreA = parseFloat(a[3]);
          const scoreB = parseFloat(b[3]);
          return scoreB - scoreA; // highest efficiency first
        });

        return {
          headers: ['שם הקמפיין השיווקי', 'מנהל שיווק מוביל', 'תקציב קמפיין סופי', 'מדד יעילות ROI (efficiency_score)', 'סך מבצעים משויכים'],
          rows
        };
      }

      case 'supplier_funding': {
        const rows = suppliers.map(s => {
          const sponsoredCamps = campaigns.filter(c => c.supplier_id === s.s_id);
          const totalBudget = sponsoredCamps.reduce((acc, c) => acc + Number(c.budget), 0);
          return [
            s.s_name,
            s.s_email,
            s.s_phone,
            `${sponsoredCamps.length} קמפיין`,
            `₪${totalBudget.toLocaleString()}`
          ];
        }).filter(row => parseFloat(row[3]) > 0); // only show suppliers who are sponsoring

        return {
          headers: ['שם ספק', 'אימייל ספק', 'טלפון', 'קמפיינים פעילים במימונו', 'סך תקציב ממומן ש"ח'],
          rows: rows.length > 0 ? rows : [['אין ספק המממן קמפיינים כעת', '-', '-', '0', '₪0']]
        };
      }
    }
  };

  const activeQueryObj = queriesList.find(q => q.id === activeQuery) || queriesList[0];
  const queryResult = executeQuery();

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left selector */}
        <div className="lg:col-span-1 space-y-1.5 border-l border-slate-100 pl-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">שאילתות ומבטים להרצה</h3>
          <div className="space-y-1">
            {queriesList.map(q => (
              <button
                key={q.id}
                onClick={() => setActiveQuery(q.id as QueryID)}
                className={`w-full text-right p-3 rounded-xl text-xs font-medium border transition-all flex justify-between items-center ${
                  activeQuery === q.id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{q.title.split(': ')[0]}</span>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${activeQuery === q.id ? 'translate-x-0.5' : 'text-slate-400'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Right workspace details */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Objective descriptive card */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              {activeQueryObj.title}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {activeQueryObj.desc}
            </p>
          </div>

          {/* Code preview block */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">שאילתת SQL קבועה (Database Query Source)</span>
            <pre className="bg-slate-900 text-cyan-400 p-4 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-950/20 max-h-[160px] custom-scrollbar">
              <code>{activeQueryObj.sql}</code>
            </pre>
          </div>

          {/* Execute Query Results table representation */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">פלט הרצה חיה (Live Computed Results Grid)</span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                Success • 200 OK
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    {queryResult.headers.map((h, i) => (
                      <th key={i} className="px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {queryResult.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      {row.map((val, i) => (
                        <td key={i} className="px-4 py-2.5 font-sans">
                          {String(val).includes('RED ALERT') ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded animate-pulse">{val}</span>
                          ) : String(val).includes('Luxury') ? (
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-bold rounded border border-amber-200">{val}</span>
                          ) : (
                            val
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
