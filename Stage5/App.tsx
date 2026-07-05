import React, { useState, useEffect } from 'react';

export default function App() {
  const [currentTable, setCurrentTable] = useState('customers');
  const [data, setData] = useState<any[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editId, setEditId] = useState<string>('');

  // Execution states for step 2 & step 4
  const [queryExecuted, setQueryExecuted] = useState(false);
  const [routineResult, setRoutineResult] = useState<any>(null);

  // Form states for routines inputs
  const [effCampaignId, setEffCampaignId] = useState('');
  const [adjDirectorId, setAdjDirectorId] = useState('');
  const [adjMaxBudget, setAdjMaxBudget] = useState('');

  const tables = [
    { id: 'customers', label: '👥 Customers' },
    { id: 'products', label: '📦 Products' },
    { id: 'campaigns', label: '📺 Advertising Campaigns' },
    { id: 'platforms', label: '🌐 Advertising Platforms' },
    { id: 'branches', label: '🏢 Branches' },
    { id: 'cities', label: '🏙️ Cities' },
    { id: 'order-items', label: '🛒 Order Items' },
    { id: 'marketing-management', label: '📊 Marketing Mgmt' },
    { id: 'promotions', label: '🏷️ Promotions' },
    { id: 'suppliers', label: '🤝 Suppliers' },
    { id: 'warehouses', label: '🏭 Warehouses' },
    { id: 'query-telaviv', label: '🔍 Q1: Tel Aviv Customers' },
    { id: 'query-expensive', label: '🔍 Q2: Expensive Platforms' },
    { id: 'func-efficiency', label: '⚡ F1: Campaign Efficiency' },
    { id: 'proc-budget', label: '⚡ P2: Adjust Budgets' }
  ];

  const schemas: { [key: string]: string[] } = {
    customers: ['customer_id', 'name', 'email', 'date_of_birth', 'loyalty_level_id', 'points_balance'],
    products: ['product_id', 'product_name', 'price', 'category_id', 'stock_quantity'],
    campaigns: ['campaign_id', 'director_id', 'campaign_name', 'start_date', 'end_date', 'budget'],
    platforms: ['platform_id', 'campaign_id', 'platform_name', 'category_id', 'price', 'audience_reach'],
    branches: ['branch_id', 'branch_name', 'city_id', 'manager_name', 'opening_hours'],
    cities: ['city_id', 'city_name'],
    'order-items': ['item_id', 'unit_cost', 'quantity', 'discount_percent', 'item_remarks', 'order_id', 'v_id'],
    'marketing-management': ['director_id', 'director_name', 'head_office', 'employee_count', 'annual_budget', 'strategy_type_id'],
    promotions: ['promo_id', 'campaign_id', 'promo_name', 'discount_percent', 'valid_from', 'valid_to'],
    suppliers: ['s_id', 's_name', 's_address', 's_email', 's_phone'],
    warehouses: ['w_id', 'capacity', 'w_location', 'w_phone', 'manager_name']
  };

  const isAnalyticalQuery = currentTable.startsWith('query-');
  const isRoutineWorkspace = currentTable.startsWith('func-') || currentTable.startsWith('proc-');

  useEffect(() => {
    setQueryExecuted(false);
    setRoutineResult(null);
    setData([]);
    setFields([]);
    if (!isAnalyticalQuery && !isRoutineWorkspace) {
      loadTableData();
    }
  }, [currentTable]);

  async function loadTableData() {
    try {
      const response = await fetch(`/api/${currentTable}`);
      const result = await response.json();
      setData(result);
      if (result.length > 0) {
        setFields(Object.keys(result[0]));
      } else {
        setFields(schemas[currentTable] || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function executeAnalyticalQuery() {
    let endpoint = '';
    if (currentTable === 'query-telaviv') endpoint = '/api/queries/tel-aviv-top-customers';
    if (currentTable === 'query-expensive') endpoint = '/api/queries/expensive-platforms';

    const response = await fetch(endpoint);
    const result = await response.json();
    setData(result);
    if (result.length > 0) setFields(Object.keys(result[0]));
    setQueryExecuted(true);
  }

  async function executeDatabaseRoutine(e: React.FormEvent) {
    e.preventDefault();
    setRoutineResult(null);
    let endpoint = '';
    let payload = {};

    if (currentTable === 'func-efficiency') {
      endpoint = '/api/procedures/calculate-efficiency';
      payload = { campaign_id: parseInt(effCampaignId) };
    } else {
      endpoint = '/api/procedures/adjust-budgets';
      payload = { director_id: parseInt(adjDirectorId), max_budget: parseInt(adjMaxBudget) };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    setRoutineResult(result);
    setQueryExecuted(true);
  }

  function openAddModal() {
    setModalMode('add');
    const initialForm: any = {};
    schemas[currentTable].forEach(f => initialForm[f] = '');
    setFormData(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(row: any) {
    setModalMode('edit');
    const primaryKey = Object.keys(row)[0];
    setEditId(row[primaryKey]);
    setFormData(row);
    setIsModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = modalMode === 'add' ? `/api/${currentTable}` : `/api/${currentTable}/${editId}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (response.ok) {
      setIsModalOpen(false);
      loadTableData();
    } else {
      const err = await response.json();
      alert("Error: " + err.error);
    }
  }

  async function deleteEntry(row: any) {
    const primaryKey = Object.keys(row)[0];
    const id = row[primaryKey];
    if (confirm(`Delete item ${id}?`)) {
      const response = await fetch(`/api/${currentTable}/${id}`, { method: 'DELETE' });
      if (response.ok) loadTableData();
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f8f9fa' }}>

      {/* SIDEBAR */}
      <div style={{ width: '300px', backgroundColor: '#212529', color: 'white', padding: '20px', boxSizing: 'border-box', overflowY: 'auto', maxHeight: '100vh' }}>
        <h3 style={{ color: '#ffc107', textAlign: 'center', marginBottom: '30px' }}>📌 Admin Panel SQL</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {tables.map(t => (
            <li key={t.id} style={{ marginBottom: '8px' }}>
              <button
                onClick={() => setCurrentTable(t.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px', border: 'none', borderRadius: '4px',
                  backgroundColor: currentTable === t.id ? '#495057' : 'transparent',
                  color: 'white', cursor: 'pointer', fontSize: '13px'
                }}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* MAIN LAYOUT AREA */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto', maxHeight: '100vh', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ textTransform: 'uppercase', fontSize: '20px' }}>Active Workspace: {currentTable.replace('-', ' ')}</h2>

          {isAnalyticalQuery && (
            <button onClick={executeAnalyticalQuery} style={{ padding: '12px 24px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              ⚡ Execute Query
            </button>
          )}

          {!isAnalyticalQuery && !isRoutineWorkspace && (
            <button onClick={openAddModal} style={{ padding: '12px 24px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              ➕ Add New Row
            </button>
          )}
        </div>

        {/* WORKSPACE LAYOUT PANELS */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>

          {/* A. If it's a routine execution tab */}
          {isRoutineWorkspace && (
            <div>
              <div style={{ background: '#f1f3f5', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0' }}>Parameters Input Form</h4>
                <form onSubmit={executeDatabaseRoutine} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                  {currentTable === 'func-efficiency' ? (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Campaign ID</label>
                      <input type="number" value={effCampaignId} onChange={e => setEffCampaignId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }} required />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Director ID</label>
                        <input type="number" value={adjDirectorId} onChange={e => setAdjDirectorId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }} required />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Max Budget (€)</label>
                        <input type="number" value={adjMaxBudget} onChange={e => setAdjMaxBudget(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }} required />
                      </div>
                    </>
                  )}
                  <button type="submit" style={{ padding: '9px 20px', backgroundColor: '#212529', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Invoke Subprogram</button>
                </form>
              </div>

              {queryExecuted && routineResult && (
                <div style={{ background: routineResult.success ? '#d1e7dd' : '#f8d7da', color: routineResult.success ? '#0f5132' : '#842029', padding: '20px', borderRadius: '6px', border: '1px solid' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Execution Console Response:</h4>
                  {routineResult.success ? (
                    <div>
                      {routineResult.efficiency_score !== undefined && <p style={{ fontSize: '18px', margin: 0 }}><strong>Calculated Efficiency Score:</strong> {routineResult.efficiency_score} / 100</p>}
                      {routineResult.message && <p style={{ fontSize: '15px', margin: 0 }}>{routineResult.message}</p>}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontFamily: 'monospace' }}><strong>Database Error Encountered:</strong> {routineResult.error}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* B. If it's a step 2 query tab but not clicked yet */}
          {isAnalyticalQuery && !queryExecuted && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d', border: '2px dashed #ced4da', borderRadius: '6px' }}>
              The query payload is prepared. Click the <strong>"Execute Query"</strong> button on the top right to analyze database metrics.
            </div>
          )}

          {/* C. Standard table grid database visualization */}
          {(!isAnalyticalQuery || queryExecuted) && !isRoutineWorkspace && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#212529', color: 'white' }}>
                  {fields.map(f => <th key={f} style={{ padding: '12px', fontSize: '13px' }}>{f.replace('_', ' ').toUpperCase()}</th>)}
                  {!isAnalyticalQuery && <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: '#6c757d', fontStyle: 'italic' }}>Dataset is empty</td></tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #dee2e6', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      {fields.map(f => (
                        <td key={f} style={{ padding: '12px', fontSize: '13px' }}>{String(row[f] ?? '')}</td>
                      ))}
                      {!isAnalyticalQuery && (
                        <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => openEditModal(row)} style={{ marginRight: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>📝</button>
                          <button onClick={() => deleteEntry(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>❌</button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EDIT & ADD DATA MODAL POPUP */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '450px', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              {modalMode === 'add' ? '✨ Add New Record' : '📝 Modify Record'}
            </h3>
            <form onSubmit={handleFormSubmit}>
              {schemas[currentTable]?.map((f, i) => (
                <div key={f} style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px', color: '#495057' }}>{f.toUpperCase().replace('_', ' ')}</label>
                  <input
                    type="text"
                    value={formData[f] ?? ''}
                    disabled={modalMode === 'edit' && i === 0}
                    onChange={e => setFormData({ ...formData, [f]: e.target.value })}
                    style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ced4da', backgroundColor: (modalMode === 'edit' && i === 0) ? '#e9ecef' : 'white' }}
                    required
                  />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#198754', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}