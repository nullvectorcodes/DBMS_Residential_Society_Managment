# 🏢 Skyline Heights - Residential Society Management System (DBMS & MySQL)

A modern, full-featured **Residential Society Management Dashboard** built with strict **Relational Database Management System (DBMS)** standards and **MySQL 8.x**.

Designed to track flat occupancies, resident profiles (Owners & Tenants), maintenance collections, payment verifications, and defaulter audits with interactive SQL query execution.

---

## 🌟 Key Highlights & DBMS Features

- **Relational DBMS Design (3NF Normalization)**:
  - Separate normalized entities: `wings`, `flats`, `residents`, `maintenance_bills`, `complaints`.
  - **Foreign Key Constraints** with referential integrity (`ON DELETE CASCADE` / `RESTRICT`).
  - **Composite Unique Constraints**: e.g., `(flat_id, billing_month)` ensures no duplicate billing for the same unit.
  - **Indexed Columns**: Indexes on `status`, `billing_month`, and `resident_type` for high-throughput query execution.
- **20 Verified Mock Entries**:
  - Exactly **20 Flats** mapped across Wing A, Wing B, and Wing C.
  - Exactly **20 Residents** (14 Owners, 6 Tenants) with verified phone, email, and emergency contact.
  - Exactly **20 Maintenance Bills** for October 2026 cycle:
    - **13 Paid** (via UPI, Net Banking, Credit Card, Cash)
    - **4 Pending**
    - **3 Overdue Defaulters**
- **Executive-Grade UI Dashboard**:
  - Sleek dark theme with obsidian background, vibrant status badges, and smooth glassmorphism.
  - Real-time KPI summary tiles & collection health progress bars.
  - Interactive **Maintenance Billing Table**: Filter by Paid / Pending / Overdue, search by name or flat, and **Mark as Paid** modal.
  - **Residents Directory**: Filter by Owners vs Tenants, quick phone dialing, and **Add Resident** modal.
  - **Interactive Society Map**: Visual grid of flats by Tower with live occupancy & payment state.
  - **Interactive DBMS & SQL Console**: Preset and custom SQL query runner with live query timing and table rendering.
  - **One-Click CSV Export**: Download complete maintenance ledger audits.

---

## 📂 Project Structure

```
DBMS_Residential_Society_Managment/
├── database/
│   ├── schema.sql         # DDL: Relational schema, tables, foreign keys, indexes
│   ├── seed.sql           # DML: 20 mock flats, residents, maintenance records
│   ├── mockData.json      # Structured JSON copy for resilient fallback
│   ├── db.js              # MySQL connection pool & relational query layer
│   └── init.js            # CLI script to execute schema and seed into MySQL
├── server/
│   └── index.js           # Express REST API server & static file host
├── public/
│   ├── index.html         # Modern dashboard UI
│   ├── style.css          # Executive dark glassmorphic styling
│   └── app.js             # Client-side dynamic controller & SQL runner
├── .env                   # Database configuration
├── .env.example           # Environment template
└── package.json           # Dependencies and run scripts
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure MySQL Credentials
Edit `.env` (or use the built-in in-app **MySQL Settings** modal):
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=residential_society_db
```

### 3. Initialize MySQL Database & 20 Mock Records
Run the initialization script:
```bash
npm run db:init
```
*(Alternatively, you can click **"Test & Connect MySQL"** directly inside the web UI!)*

### 4. Start the Application
```bash
npm start
```
Open your browser and navigate to:
```
http://localhost:3000
```

> **Note**: If MySQL credentials are not yet entered, the dashboard automatically boots in resilient mock mode with all 20 records loaded, so you can interact with the system immediately while connecting MySQL at your convenience!

---

## 📊 Relational Database Schema Overview

```
 +--------------------+       1:N       +----------------------+
 |       wings        | --------------< |        flats         |
 +--------------------+                 +----------------------+
 | PK wing_id         |                 | PK flat_id           |
 |    wing_name       |                 | FK wing_id           |
 |    total_floors    |                 |    flat_number       |
 +--------------------+                 |    flat_type         |
                                        |    occupancy_status  |
                                        +----------------------+
                                                   | 1:N
                                                   v
 +--------------------+       1:N       +----------------------+
 | maintenance_bills  | >-------------- |      residents       |
 +--------------------+                 +----------------------+
 | PK bill_id         |                 | PK resident_id       |
 | FK flat_id         |                 | FK flat_id           |
 | FK resident_id     |                 |    first_name        |
 |    billing_month   |                 |    last_name         |
 |    amount          |                 |    resident_type     |
 |    due_date        |                 |    phone / email     |
 |    status          |                 +----------------------+
 |    payment_method  |
 |    transaction_ref |
 +--------------------+
```
