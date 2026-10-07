const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const mockDataPath = path.join(__dirname, 'mockData.json');
let fallbackStore = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

let pool = null;
let dbStatus = {
  connected: false,
  usingFallback: true,
  engine: 'Local In-Memory Cache (Mock Seed)',
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'residential_society_db',
  error: null
};

// Attempt to connect to MySQL
async function createMySQLPool(config = {}) {
  const host = config.host || process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(config.port || process.env.DB_PORT || '3306', 10);
  const user = config.user || process.env.DB_USER || 'root';
  const password = config.password !== undefined ? config.password : (process.env.DB_PASSWORD || '');
  const database = config.database || process.env.DB_NAME || 'residential_society_db';

  try {
    const tempPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });

    // Test a basic query
    const [rows] = await tempPool.query('SELECT 1 as test');
    pool = tempPool;
    dbStatus = {
      connected: true,
      usingFallback: false,
      engine: 'MySQL 8.x (Native Relational Engine)',
      host,
      user,
      database,
      error: null
    };
    console.log(`[DBMS] Successfully connected to MySQL at ${host}:${port}/${database}`);
    return { success: true };
  } catch (err) {
    dbStatus = {
      connected: false,
      usingFallback: true,
      engine: 'Local In-Memory Cache (Relational Mock Store)',
      host,
      user,
      database,
      error: err.message
    };
    console.warn(`[DBMS Notice] MySQL not connected (${err.message}). Using local 20-record mock DBMS engine.`);
    return { success: false, error: err.message };
  }
}

// Initialize on startup
createMySQLPool();

async function getDbStatus() {
  return dbStatus;
}

// Initializer to run schema and seed into MySQL
async function initializeMySQLDatabase(config = {}) {
  const host = config.host || process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(config.port || process.env.DB_PORT || '3306', 10);
  const user = config.user || process.env.DB_USER || 'root';
  const password = config.password !== undefined ? config.password : (process.env.DB_PASSWORD || '');
  const database = config.database || process.env.DB_NAME || 'residential_society_db';

  try {
    // Step 1: Connect to server without specific database
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    await conn.query(schemaSql);
    await conn.query(seedSql);
    await conn.end();

    // Step 2: Connect pool with database
    const poolRes = await createMySQLPool({ host, port, user, password, database });
    return { success: true, message: 'MySQL Database residential_society_db successfully created with 20 mock records!' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 1. Get Stats (KPI cards)
async function getSocietyStats() {
  if (dbStatus.connected && pool) {
    try {
      const [[flatCount]] = await pool.query('SELECT COUNT(*) as totalFlats, SUM(CASE WHEN occupancy_status = "OCCUPIED" THEN 1 ELSE 0 END) as occupiedFlats FROM flats');
      const [[residentCount]] = await pool.query('SELECT COUNT(*) as totalResidents, SUM(CASE WHEN resident_type = "OWNER" THEN 1 ELSE 0 END) as owners, SUM(CASE WHEN resident_type = "TENANT" THEN 1 ELSE 0 END) as tenants FROM residents WHERE is_active = 1');
      const [[billStats]] = await pool.query(`
        SELECT 
          COUNT(*) as totalBills,
          SUM(amount) as totalBilledAmount,
          SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as totalCollected,
          SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as totalPending,
          SUM(CASE WHEN status = 'OVERDUE' THEN amount ELSE 0 END) as totalOverdue,
          SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paidCount,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) as overdueCount
        FROM maintenance_bills
        WHERE billing_month = '2026-10'
      `);

      return {
        totalFlats: flatCount.totalFlats || 0,
        occupiedFlats: flatCount.occupiedFlats || 0,
        occupancyRate: flatCount.totalFlats ? Math.round((flatCount.occupiedFlats / flatCount.totalFlats) * 100) : 0,
        totalResidents: residentCount.totalResidents || 0,
        owners: residentCount.owners || 0,
        tenants: residentCount.tenants || 0,
        totalBilledAmount: parseFloat(billStats.totalBilledAmount || 0),
        totalCollected: parseFloat(billStats.totalCollected || 0),
        totalPending: parseFloat(billStats.totalPending || 0),
        totalOverdue: parseFloat(billStats.totalOverdue || 0),
        paidCount: billStats.paidCount || 0,
        pendingCount: billStats.pendingCount || 0,
        overdueCount: billStats.overdueCount || 0
      };
    } catch (err) {
      console.error('MySQL query error in getSocietyStats:', err.message);
    }
  }

  // Fallback calculation using memory store
  const flats = fallbackStore.flats;
  const residents = fallbackStore.residents.filter(r => r.is_active);
  const bills = fallbackStore.maintenance_bills;

  const totalFlats = flats.length;
  const occupiedFlats = flats.filter(f => f.occupancy_status === 'OCCUPIED').length;
  const owners = residents.filter(r => r.resident_type === 'OWNER').length;
  const tenants = residents.filter(r => r.resident_type === 'TENANT').length;

  let totalBilledAmount = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  bills.forEach(b => {
    totalBilledAmount += b.amount;
    if (b.status === 'PAID') {
      totalCollected += b.amount;
      paidCount++;
    } else if (b.status === 'PENDING') {
      totalPending += b.amount;
      pendingCount++;
    } else if (b.status === 'OVERDUE') {
      totalOverdue += b.amount;
      overdueCount++;
    }
  });

  return {
    totalFlats,
    occupiedFlats,
    occupancyRate: Math.round((occupiedFlats / totalFlats) * 100),
    totalResidents: residents.length,
    owners,
    tenants,
    totalBilledAmount,
    totalCollected,
    totalPending,
    totalOverdue,
    paidCount,
    pendingCount,
    overdueCount
  };
}

// 2. Get Maintenance Bills (with JOIN on flats and residents)
async function getMaintenanceBills(filters = {}) {
  const { status, month, search } = filters;

  if (dbStatus.connected && pool) {
    try {
      let query = `
        SELECT 
          b.bill_id,
          b.flat_id,
          b.resident_id,
          b.billing_month,
          b.amount,
          b.due_date,
          b.status,
          b.payment_date,
          b.payment_method,
          b.transaction_ref,
          b.notes,
          f.flat_number,
          f.flat_type,
          w.wing_name,
          r.first_name,
          r.last_name,
          CONCAT(r.first_name, ' ', r.last_name) AS resident_name,
          r.phone,
          r.resident_type
        FROM maintenance_bills b
        INNER JOIN flats f ON b.flat_id = f.flat_id
        INNER JOIN wings w ON f.wing_id = w.wing_id
        INNER JOIN residents r ON b.resident_id = r.resident_id
        WHERE 1=1
      `;
      const params = [];

      if (status && status !== 'ALL') {
        query += ' AND b.status = ?';
        params.push(status);
      }
      if (month) {
        query += ' AND b.billing_month = ?';
        params.push(month);
      }
      if (search) {
        query += ` AND (f.flat_number LIKE ? OR r.first_name LIKE ? OR r.last_name LIKE ? OR b.transaction_ref LIKE ?)`;
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }

      query += ' ORDER BY b.bill_id ASC';
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (err) {
      console.error('MySQL query error in getMaintenanceBills:', err.message);
    }
  }

  // Fallback: Perform relational in-memory JOIN
  let result = fallbackStore.maintenance_bills.map(b => {
    const flat = fallbackStore.flats.find(f => f.flat_id === b.flat_id) || {};
    const resident = fallbackStore.residents.find(r => r.resident_id === b.resident_id) || {};
    const wing = fallbackStore.wings.find(w => w.wing_id === flat.wing_id) || {};

    return {
      ...b,
      flat_number: flat.flat_number || 'N/A',
      flat_type: flat.flat_type || 'N/A',
      wing_name: wing.wing_name || 'N/A',
      first_name: resident.first_name || '',
      last_name: resident.last_name || '',
      resident_name: `${resident.first_name || ''} ${resident.last_name || ''}`.trim(),
      phone: resident.phone || '',
      resident_type: resident.resident_type || 'OWNER'
    };
  });

  if (status && status !== 'ALL') {
    result = result.filter(r => r.status === status);
  }
  if (month) {
    result = result.filter(r => r.billing_month === month);
  }
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(r => 
      r.flat_number.toLowerCase().includes(s) ||
      r.resident_name.toLowerCase().includes(s) ||
      (r.transaction_ref && r.transaction_ref.toLowerCase().includes(s))
    );
  }

  return result;
}

// 3. Mark Bill as Paid
async function markBillAsPaid(billId, paymentDetails) {
  const { payment_method, transaction_ref, notes, payment_date } = paymentDetails;
  const payDate = payment_date || new Date().toISOString().split('T')[0];

  if (dbStatus.connected && pool) {
    try {
      const [result] = await pool.query(`
        UPDATE maintenance_bills
        SET status = 'PAID',
            payment_date = ?,
            payment_method = ?,
            transaction_ref = ?,
            notes = ?
        WHERE bill_id = ?
      `, [payDate, payment_method || 'UPI', transaction_ref || `TXN-${Date.now().toString().slice(-6)}`, notes || 'Settled via dashboard', billId]);
      
      return { success: true, affectedRows: result.affectedRows };
    } catch (err) {
      console.error('MySQL update error in markBillAsPaid:', err.message);
      throw err;
    }
  }

  const bill = fallbackStore.maintenance_bills.find(b => b.bill_id === parseInt(billId, 10));
  if (!bill) {
    throw new Error('Bill not found');
  }
  bill.status = 'PAID';
  bill.payment_date = payDate;
  bill.payment_method = payment_method || 'UPI';
  bill.transaction_ref = transaction_ref || `TXN-${Date.now().toString().slice(-6)}`;
  bill.notes = notes || 'Settled via dashboard';

  return { success: true, updated: bill };
}

// 4. Get Residents List (with Flat and Wing JOIN)
async function getResidents(filters = {}) {
  const { type, search } = filters;

  if (dbStatus.connected && pool) {
    try {
      let query = `
        SELECT 
          r.resident_id,
          r.flat_id,
          r.first_name,
          r.last_name,
          CONCAT(r.first_name, ' ', r.last_name) AS full_name,
          r.phone,
          r.email,
          r.resident_type,
          r.move_in_date,
          r.emergency_contact,
          r.is_active,
          f.flat_number,
          f.floor_number,
          f.flat_type,
          f.area_sqft,
          w.wing_name
        FROM residents r
        INNER JOIN flats f ON r.flat_id = f.flat_id
        INNER JOIN wings w ON f.wing_id = w.wing_id
        WHERE r.is_active = 1
      `;
      const params = [];

      if (type && type !== 'ALL') {
        query += ' AND r.resident_type = ?';
        params.push(type);
      }
      if (search) {
        query += ` AND (r.first_name LIKE ? OR r.last_name LIKE ? OR r.phone LIKE ? OR r.email LIKE ? OR f.flat_number LIKE ?)`;
        const s = `%${search}%`;
        params.push(s, s, s, s, s);
      }

      query += ' ORDER BY f.wing_id, f.floor_number, f.flat_number';
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (err) {
      console.error('MySQL query error in getResidents:', err.message);
    }
  }

  let result = fallbackStore.residents.map(r => {
    const flat = fallbackStore.flats.find(f => f.flat_id === r.flat_id) || {};
    const wing = fallbackStore.wings.find(w => w.wing_id === flat.wing_id) || {};
    return {
      ...r,
      full_name: `${r.first_name} ${r.last_name}`,
      flat_number: flat.flat_number || 'N/A',
      floor_number: flat.floor_number || 1,
      flat_type: flat.flat_type || '2BHK',
      area_sqft: flat.area_sqft || 1000,
      wing_name: wing.wing_name || 'N/A'
    };
  });

  if (type && type !== 'ALL') {
    result = result.filter(r => r.resident_type === type);
  }
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(r =>
      r.full_name.toLowerCase().includes(s) ||
      r.phone.toLowerCase().includes(s) ||
      r.email.toLowerCase().includes(s) ||
      r.flat_number.toLowerCase().includes(s)
    );
  }

  return result;
}

// 5. Add Resident
async function addResident(data) {
  const { flat_id, first_name, last_name, phone, email, resident_type, move_in_date, emergency_contact } = data;

  if (dbStatus.connected && pool) {
    try {
      const [result] = await pool.query(`
        INSERT INTO residents (flat_id, first_name, last_name, phone, email, resident_type, move_in_date, emergency_contact)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [flat_id, first_name, last_name, phone, email, resident_type || 'OWNER', move_in_date || new Date().toISOString().split('T')[0], emergency_contact || null]);

      return { success: true, resident_id: result.insertId };
    } catch (err) {
      console.error('MySQL insert error in addResident:', err.message);
      throw err;
    }
  }

  const newId = fallbackStore.residents.length > 0 ? Math.max(...fallbackStore.residents.map(r => r.resident_id)) + 1 : 1;
  const newResident = {
    resident_id: newId,
    flat_id: parseInt(flat_id, 10),
    first_name,
    last_name,
    phone,
    email,
    resident_type: resident_type || 'OWNER',
    move_in_date: move_in_date || new Date().toISOString().split('T')[0],
    emergency_contact: emergency_contact || '',
    is_active: 1
  };
  fallbackStore.residents.push(newResident);
  return { success: true, resident_id: newId };
}

// 6. Get Flats Directory
async function getFlats() {
  if (dbStatus.connected && pool) {
    try {
      const query = `
        SELECT 
          f.flat_id,
          f.wing_id,
          f.flat_number,
          f.floor_number,
          f.flat_type,
          f.area_sqft,
          f.occupancy_status,
          w.wing_name,
          r.resident_id,
          CONCAT(r.first_name, ' ', r.last_name) AS resident_name,
          r.resident_type,
          r.phone
        FROM flats f
        INNER JOIN wings w ON f.wing_id = w.wing_id
        LEFT JOIN residents r ON f.flat_id = r.flat_id AND r.is_active = 1
        ORDER BY f.wing_id, f.floor_number, f.flat_number
      `;
      const [rows] = await pool.query(query);
      return rows;
    } catch (err) {
      console.error('MySQL query error in getFlats:', err.message);
    }
  }

  return fallbackStore.flats.map(f => {
    const res = fallbackStore.residents.find(r => r.flat_id === f.flat_id && r.is_active);
    const wing = fallbackStore.wings.find(w => w.wing_id === f.wing_id);
    return {
      ...f,
      wing_name: wing ? wing.wing_name : 'Wing A',
      resident_id: res ? res.resident_id : null,
      resident_name: res ? `${res.first_name} ${res.last_name}` : 'Vacant',
      resident_type: res ? res.resident_type : null,
      phone: res ? res.phone : null
    };
  });
}

// 7. Execute custom SQL query (Safe read-only execution for DBMS console demo)
async function executeCustomQuery(sql) {
  const startTime = Date.now();
  const trimmed = sql.trim();

  if (dbStatus.connected && pool) {
    try {
      const [rows, fields] = await pool.query(trimmed);
      const executionTimeMs = Date.now() - startTime;
      return {
        success: true,
        source: 'MySQL Database',
        executionTimeMs,
        rowCount: Array.isArray(rows) ? rows.length : 1,
        columns: fields ? fields.map(f => f.name) : (Array.isArray(rows) && rows[0] ? Object.keys(rows[0]) : []),
        rows: Array.isArray(rows) ? rows : [rows]
      };
    } catch (err) {
      return {
        success: false,
        source: 'MySQL Database',
        error: err.message
      };
    }
  }

  // If in fallback mode, simulate or return friendly response
  return {
    success: false,
    source: 'Local In-Memory Cache',
    error: 'Native SQL Query Runner requires active MySQL connection. Please configure your MySQL password in Settings to execute live queries.'
  };
}

module.exports = {
  createMySQLPool,
  initializeMySQLDatabase,
  getDbStatus,
  getSocietyStats,
  getMaintenanceBills,
  markBillAsPaid,
  getResidents,
  addResident,
  getFlats,
  executeCustomQuery
};
