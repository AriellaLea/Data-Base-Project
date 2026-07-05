import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.static('public'));
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const pool = new Pool({
  user: process.env.SQL_USER,
  host: process.env.SQL_HOST,
  database: process.env.SQL_DB_NAME,
  password: String(process.env.SQL_PASSWORD),
  port: parseInt(process.env.SQL_PORT || '5432'),
});

// =========================================================================
//  CRUD READ OPERATIONS WITH JOINS (SHOW NAMES INSTEAD OF STRANGE IDs)
// =========================================================================

app.get('/api/customers', async (req, res) => {
  try {
    const query = `
      SELECT c.customer_id, c.name AS customer_name, c.email, c.date_of_birth, c.points_balance, l.level_name AS loyalty_level
      FROM customers c
      LEFT JOIN loyalty_levels l ON c.loyalty_level_id = l.loyalty_id
      ORDER BY c.customer_id ASC
    `;
    res.json((await pool.query(query)).rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/products', async (req, res) => {
  try {
    const query = `
      SELECT p.product_id, p.product_name, p.price, p.stock_quantity, c.category_name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      ORDER BY p.product_id ASC
    `;
    res.json((await pool.query(query)).rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/campaigns', async (req, res) => {
  try {
    const query = `
      SELECT ac.campaign_id, ac.campaign_name, ac.start_date, ac.end_date, ac.budget,
             mm.director_name AS director, cs.status_name AS status
      FROM advertising_campaigns ac
      LEFT JOIN campaign_status cs ON ac.status_id = cs.status_id
      LEFT JOIN marketing_management mm ON ac.director_id = mm.director_id
      ORDER BY ac.campaign_id ASC
    `;
    res.json((await pool.query(query)).rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/platforms', async (req, res) => {
  try {
    const query = `
      SELECT ap.platform_id, ap.platform_name, ap.price, ap.audience_reach,
             ac.campaign_name AS campaign, pc.category_name AS platform_category
      FROM advertising_platforms ap
      LEFT JOIN platform_categories pc ON ap.category_id = pc.category_id
      LEFT JOIN advertising_campaigns ac ON ap.campaign_id = ac.campaign_id
      ORDER BY ap.platform_id ASC
    `;
    res.json((await pool.query(query)).rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/branches', async (req, res) => {
  try {
    const query = `
      SELECT b.branch_id, b.branch_name, b.manager_name, b.opening_hours, c.city_name AS city
      FROM branches b
      LEFT JOIN cities c ON b.city_id = c.city_id
      ORDER BY b.branch_id ASC
    `;
    res.json((await pool.query(query)).rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/cities', async (req, res) => {
  try { res.json((await pool.query('SELECT city_id, city_name FROM cities ORDER BY city_id ASC')).rows); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/order-items', async (req, res) => {
  try {
    const query = `
      SELECT oi.item_id, oi.unit_cost, oi.quantity, oi.discount_percent, oi.item_remarks, oi.order_id, s.s_name AS supplier
      FROM order_items oi
      LEFT JOIN suppliers s ON oi.v_id = s.s_id
      ORDER BY oi.item_id ASC
    `;
    res.json((await pool.query(query)).rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/marketing-management', async (req, res) => {
  try {
    const query = `
      SELECT mm.director_id, mm.director_name, mm.head_office, mm.employee_count, mm.annual_budget, st.strategy_name AS strategy_type
      FROM marketing_management mm
      LEFT JOIN strategy_types st ON mm.strategy_type_id = st.strategy_id
      ORDER BY mm.director_id ASC
    `;
    res.json((await pool.query(query)).rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/promotions', async (req, res) => {
  try {
    const query = `
      SELECT p.promo_id, p.promo_name, p.discount_percent, p.valid_from, p.valid_to, ac.campaign_name AS campaign
      FROM promotions p
      LEFT JOIN advertising_campaigns ac ON p.campaign_id = ac.campaign_id
      ORDER BY p.promo_id ASC
    `;
    res.json((await pool.query(query)).rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/suppliers', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM suppliers ORDER BY s_id ASC')).rows); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/warehouses', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM warehouses ORDER BY w_id ASC')).rows); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Dynamic writes
app.post('/api/:table', async (req, res) => {
  const { table } = req.params;
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);
  const subs = keys.map((_, i) => `$${i + 1}`).join(', ');
  try {
    await pool.query(`INSERT INTO ${table.replace('-', '_')} (${keys.join(', ')}) VALUES (${subs})`, values);
    res.status(201).json({ message: 'Success' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put('/api/:table/:id', async (req, res) => {
   const { table, id } = req.params;

   // 1. Traduction du nom de la table de l'interface vers le vrai nom SQL
   let realTableName = table.replace('-', '_');
   if (table === 'campaigns') realTableName = 'advertising_campaigns';
   if (table === 'platforms') realTableName = 'advertising_platforms';
   if (table === 'marketing-management') realTableName = 'marketing_management';

   // 2. Filtrage pour retirer les colonnes alias/virtuelles issues des JOINs
   const payload = { ...req.body };
   delete payload.director; // On supprime le nom textuel du directeur
   delete payload.status;   // On supprime le nom textuel du statut
   delete payload.category; // Sécurité pour les produits/plateformes
   delete payload.loyalty_level; // Sécurité pour les clients
   delete payload.platform_category;
   delete payload.campaign;
   delete payload.city;
   delete payload.supplier;

   const keys = Object.keys(payload);
   const values = Object.values(payload);

   if (keys.length === 0) {
     return res.status(400).json({ error: "Aucune donnée valide à mettre à jour" });
   }

   const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

   // 3. Identification de la bonne clé primaire
   const pk = realTableName === 'customers' ? 'customer_id' :
              realTableName === 'products' ? 'product_id' :
              realTableName === 'advertising_campaigns' ? 'campaign_id' :
              realTableName === 'advertising_platforms' ? 'platform_id' :
              realTableName === 'branches' ? 'branch_id' :
              realTableName === 'cities' ? 'city_id' :
              realTableName === 'marketing_management' ? 'director_id' :
              realTableName === 'promotions' ? 'promo_id' :
              realTableName === 'suppliers' ? 's_id' :
              realTableName === 'warehouses' ? 'w_id' : 'item_id';

   values.push(id);
   try {
     const sqlQuery = `UPDATE ${realTableName} SET ${sets} WHERE ${pk} = $${values.length}`;
     await pool.query(sqlQuery, values);
     res.json({ message: 'Updated successfully' });
   } catch (err: any) {
     console.error("❌ Erreur lors du UPDATE :", err.message);
     res.status(500).json({ error: err.message });
   }
 });

// Dynamic DELETE with exact table name mapping
app.delete('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;

  // Traduction du nom de la table
  let realTableName = table.replace('-', '_');
  if (table === 'campaigns') realTableName = 'advertising_campaigns';
  if (table === 'platforms') realTableName = 'advertising_platforms';
  if (table === 'marketing-management') realTableName = 'marketing_management';

  const pk = realTableName === 'customers' ? 'customer_id' :
             realTableName === 'products' ? 'product_id' :
             realTableName === 'advertising_campaigns' ? 'campaign_id' :
             realTableName === 'advertising_platforms' ? 'platform_id' :
             realTableName === 'branches' ? 'branch_id' :
             realTableName === 'cities' ? 'city_id' :
             realTableName === 'marketing_management' ? 'director_id' :
             realTableName === 'promotions' ? 'promo_id' :
             realTableName === 'suppliers' ? 's_id' :
             realTableName === 'warehouses' ? 'w_id' : 'item_id';

  try {
    await pool.query(`DELETE FROM ${realTableName} WHERE ${pk} = $1`, [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    console.error("❌ Erreur lors du DELETE :", err.message);
    res.status(500).json({ error: err.message });
  }
}
);
app.delete('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  const pk = table === 'customers' ? 'customer_id' : table === 'products' ? 'product_id' : table === 'campaigns' ? 'campaign_id' : table === 'platforms' ? 'platform_id' : table === 'branches' ? 'branch_id' : table === 'cities' ? 'city_id' : table === 'marketing-management' ? 'director_id' : table === 'promotions' ? 'promo_id' : table === 'suppliers' ? 's_id' : table === 'warehouses' ? 'w_id' : 'item_id';
  try {
    await pool.query(`DELETE FROM ${table.replace('-', '_')} WHERE ${pk} = $1`, [id]);
    res.json({ message: 'Deleted' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// =========================================================================
//  STEP 2 QUERIES
// =========================================================================
app.get('/api/queries/tel-aviv-top-customers', async (req, res) => {
  try {
    const query = `
      SELECT c.customer_id, c.name AS customer_name, c.points_balance, ci.city_name
      FROM customers c
      CROSS JOIN cities ci
      WHERE ci.city_name = 'Tel Aviv' AND c.points_balance > 100
      LIMIT 5;
    `;
    res.json((await pool.query(query)).rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/queries/expensive-platforms', async (req, res) => {
  try {
    const query = `
      SELECT camp.campaign_name, plat.platform_name, plat.price
      FROM advertising_campaigns camp
      JOIN advertising_platforms plat ON camp.campaign_id = plat.campaign_id
      WHERE plat.price > 5000;
    `;
    res.json((await pool.query(query)).rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// =========================================================================
//  STEP 4 ROUTINES EXECUTION
// =========================================================================
app.post('/api/procedures/calculate-efficiency', async (req, res) => {
  const { campaign_id } = req.body;

  console.log("📥 Requête interface reçue pour Campaign ID :", campaign_id);

  if (!campaign_id || isNaN(Number(campaign_id))) {
    return res.status(400).json({ success: false, error: "ID de campagne invalide ou manquant." });
  }

  try {
    // On appelle la fonction
    const result = await pool.query('SELECT fn_calculate_campaign_efficiency($1)', [Number(campaign_id)]);

    // Sécurité maximale : on récupère la première valeur de la première ligne, peu importe son nom
    const firstRow = result.rows[0];
    const rawValue = firstRow ? Object.values(firstRow)[0] : 0;
    const score = parseFloat(String(rawValue)) || 0;

    console.log("✅ Score calculé renvoyé à l'interface :", score);

    res.json({
      success: true,
      efficiency_score: score
    });

  } catch (err: any) {
    console.error("❌ Erreur interceptée par le serveur :", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/procedures/adjust-budgets', async (req, res) => {
  const { director_id, max_budget } = req.body;
  try {
    await pool.query('CALL sp_adjust_campaign_budgets($1, $2)', [director_id, max_budget]);
    res.json({ success: true, message: `Procedure CALL completed successfully for Director ${director_id}!` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server fully operational on port ${PORT}`));