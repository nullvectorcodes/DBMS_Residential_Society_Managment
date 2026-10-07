const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('../database/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 1. Database Connection Status
app.get('/api/status', async (req, res) => {
  try {
    const status = await db.getDbStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Connect / Sync MySQL
app.post('/api/db/connect', async (req, res) => {
  const { host, port, user, password, database, initDatabase } = req.body;
  try {
    if (initDatabase) {
      const initResult = await db.initializeMySQLDatabase({ host, port, user, password, database });
      if (!initResult.success) {
        return res.status(400).json(initResult);
      }
      return res.json({ success: true, message: 'MySQL database initialized with 20 mock records & connected successfully!' });
    }

    const connectResult = await db.createMySQLPool({ host, port, user, password, database });
    if (!connectResult.success) {
      return res.status(400).json(connectResult);
    }
    res.json({ success: true, message: 'Successfully connected to MySQL database!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Society Dashboard Stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getSocietyStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Maintenance Bills List
app.get('/api/bills', async (req, res) => {
  try {
    const { status, month, search } = req.query;
    const bills = await db.getMaintenanceBills({ status, month, search });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Mark Bill as Paid
app.post('/api/bills/:id/pay', async (req, res) => {
  try {
    const billId = req.params.id;
    const { payment_method, transaction_ref, notes, payment_date } = req.body;
    const result = await db.markBillAsPaid(billId, {
      payment_method,
      transaction_ref,
      notes,
      payment_date
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Residents Directory
app.get('/api/residents', async (req, res) => {
  try {
    const { type, search } = req.query;
    const residents = await db.getResidents({ type, search });
    res.json(residents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Add Resident
app.post('/api/residents', async (req, res) => {
  try {
    const result = await db.addResident(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Flats Grid & Directory
app.get('/api/flats', async (req, res) => {
  try {
    const flats = await db.getFlats();
    res.json(flats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Interactive DBMS SQL Query Runner
app.post('/api/db/query', async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query string is required' });
    }
    const result = await db.executeCustomQuery(sql);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏢 Residential Society Management Server Running`);
  console.log(`🔗 Dashboard URL: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
