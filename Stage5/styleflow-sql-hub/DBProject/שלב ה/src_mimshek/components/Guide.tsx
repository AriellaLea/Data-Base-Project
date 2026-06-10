import { 
  CheckCircle, 
  BookOpen, 
  Terminal, 
  Database, 
  HelpCircle,
  EyeOff,
  UserCheck
} from 'lucide-react';

export default function Guide() {
  const steps = [
    {
      title: 'גישה וניהול לכל 10 טבלאות המערכת',
      desc: 'המערכת מציעה גישה מלאה לכל עשר הטבלאות המשולבות בפרויקט (מתוך התפריט הצדדי ב-CRUD Console). משם ניתן לשלוף, לסנן ולבצע שינויים בישויות.',
      icon: Database,
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      title: 'כפתורי CRUD פונקציונליים',
      desc: 'ניתן לבצע בהצלחה יצירה (Insert), שליפה (Select), עדכון (Update) ומחיקה (Delete) של רשומות מכל אחת מהטבלאות עם השפעות מיידיות על מצב מסד הנתונים.',
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      title: 'עדכון מבוסס מפתח (Prepopulate on Key)',
      desc: 'בזמן עדכון, המשתמש מזין מפתח או בוחר ID מרשימה קיימת. המערכת שולפת ומאכלסת את כל השדות הקיימים בטופס הדינמי – המשתמש מעדכן משם בלחיצה מהירה.',
      icon: UserCheck,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      title: 'הסתרת מזהי ID פיזיים והצגת שמות (Automatic Joins)',
      desc: 'הטבלאות אינן מציגות מזהי ID של מפתחות זרים! בעזרת מנגנון Joins דינמי, המזהים מוחלפים בשמות וריאציות, מיקומים, קטגוריות, ומנהלים משויכים.',
      icon: EyeOff,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'הפעלת פרוצדורות ופונקציות (PL/pgSQL)',
      desc: 'טביעת האצבע מפרוייקט שלב ד\' חיה כאן! ניתן להפעיל את הפרוצדורה sp_process_warehouse_restock, את sp_adjust_campaign_budgets, את חישוב דירוג ה-ROI ודוח ה-Ref Cursor בצורה חיה.',
      icon: Terminal,
      color: 'text-rose-600 bg-rose-50'
    },
    {
      title: 'אכיפת טריגרים ואילוצים פיננסיים',
      desc: 'כל CRUD גורר שינויים ברקע: אילוצי CHECK המייצרים שגיאות, טריגר מלאי המעדכן את store_stock_audit_log (ויוצר אזהרת קצב מלאי קריטי), וטריגר קמפיין האוכף אנטגוניזם תקציבי מעל 50%.',
      icon: HelpCircle,
      color: 'text-purple-600 bg-purple-50'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-right" dir="rtl">
      
      {/* Intro header */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          מדריך בקרה ותיעוד פרויקט: StyleFlow Control Suite
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          יישום זה משלב את כלל הדרישות האקדמיות לרמת גימור יוצאת דופן. 
          להלן פירוט הדרכים בהן מולאו דרישות "שלב ה' - ממשק גרפי ומערכת בקרה פנימית":
        </p>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {steps.map((step, idx) => (
          <div key={idx} className="p-5 bg-white border border-slate-200/80 rounded-2xl flex gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${step.color}`}>
              <step.icon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl space-y-3">
        <h4 className="font-bold text-white text-sm">💡 הוראות הגשה מומלצות בתיקיית ה-GIT:</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          יצרנו עבורכם את התיקייה המדויקת <code>DBProject/שלב ה</code> ובתוכה קובץ <code>README.md</code> מקיף המכיל את הוראות הכניסה, הסברים על הכלים וכלי הפיתוח ששימשו אותנו! 
          כל קוד הממשק שלכם ארוז בתיקייה זו ונמצא בהישג יד.
        </p>
      </div>

    </div>
  );
}
