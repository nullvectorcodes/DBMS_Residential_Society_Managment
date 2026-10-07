# 🏢 Presentation III: Residential Society Management System
> **Database Management Systems (DBMS) Final Project & Interactive Demonstration**

A comprehensive, production-grade **Residential Society Management Dashboard & Relational Database System** built using **MySQL 8.x**, **Node.js / Express**, and a modern **Light-Themed Web Interface**.

This directory contains the entire runnable source code, relational schemas, mock dataset initialization scripts, REST APIs, and front-end interface for **Presentation III**.

---

## 📋 Table of Contents
1. [System Architecture](#-system-architecture)
2. [DBMS Relational Design & 3NF Normalization](#-dbms-relational-design--3nf-normalization)
3. [Database Schema & Data Dictionary](#-database-schema--data-dictionary)
4. [20 Seed Records Overview](#-20-seed-records-overview)
5. [Quick Start & Setup Instructions](#-quick-start--setup-instructions)
6. [Interactive Presentation Demonstration Guide](#-interactive-presentation-demonstration-guide)
7. [Direct MySQL CLI Verification Queries](#-direct-mysql-cli-verification-queries)
8. [REST API Documentation](#-rest-api-documentation)
9. [Directory Structure](#-directory-structure)

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Presentation Layer                   │
│      Light-Themed Responsive Dashboard (HTML5/CSS3/ES6)      │
│  - Collapsible Sidebar & Navigation Rail                    │
│  - Real-Time Society Map & Tower Grid                       │
│  - Resident Directory (Owners & Tenants)                    │
│  - Maintenance Billing Ledger with "Mark as Paid" Modal     │
│  - Live SQL Query Console with Query Execution Benchmarking │
└──────────────────────────────▲──────────────────────────────┘
                               │ JSON / HTTP REST
┌──────────────────────────────▼──────────────────────────────┐
│                    Application Server Layer                 │
│              Express.js REST API & Static Server            │
│  - Modular Endpoints (`/api/bills`, `/api/residents`, etc.) │
│  - Relational Integrity Enforcer & Error Handler            │
│  - Resilient Fallback Engine                                │
└──────────────────────────────▲──────────────────────────────┘
                               │ mysql2 Connection Pool
┌──────────────────────────────▼──────────────────────────────┐
│                   Database Storage Layer                    │
│                        MySQL 8.x                            │
│  - 3NF Normalized Schema (`residential_society_db`)         │
│  - Foreign Key Constraints with Cascade / Restrict          │
│  - Composite Unique Billing Keys `(flat_id, billing_month)` │
│  - Status & Composite Indexes for High Throughput           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 DBMS Relational Design & 3NF Normalization

The system is rigorously normalized to **Third Normal Form (3NF)** to eliminate update, insertion, and deletion anomalies:

1. **First Normal Form (1NF)**:
   - All attributes contain atomic values (phone, emails, flat numbers, amounts).
   - No repeating groups or multivalued columns; separate records for each bill and resident.
2. **Second Normal Form (2NF)**:
   - Every non-key attribute is fully functionally dependent on the primary key.
   - For example, `wings` attributes (name, total floors) are stored in `wings`, not repeated in `flats`.
3. **Third Normal Form (3NF)**:
   - No transitive dependencies exist.
   - Residents reference `flat_id`; flats reference `wing_id`.
   - Wing details depend strictly on `wing_id`, never transitively via `resident_id`.
4. **Referential Integrity & Constraints**:
   - `flats.wing_id` references `wings.id` (`ON DELETE RESTRICT`).
   - `residents.flat_id` references `flats.id` (`ON DELETE RESTRICT`).
   - `maintenance_bills.flat_id` references `flats.id` (`ON DELETE CASCADE`).
   - `maintenance_bills.resident_id` references `residents.id` (`ON DELETE SET NULL`).
   - **Composite Unique Constraint**: `UNIQUE KEY unique_flat_month (flat_id, billing_month)` prevents duplicate billing for the same flat in the same billing cycle.

---

## 🗄️ Database Schema & Data Dictionary

```sql
CREATE DATABASE IF NOT EXISTS residential_society_db;
USE residential_society_db;

-- 1. Wings / Towers
CREATE TABLE wings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    total_floors INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Flats / Apartments
CREATE TABLE flats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wing_id INT NOT NULL,
    flat_number VARCHAR(10) NOT NULL,
    floor_number INT NOT NULL,
    bhk_type ENUM('1BHK', '2BHK', '3BHK', '4BHK') NOT NULL DEFAULT '2BHK',
    square_feet INT NOT NULL DEFAULT 1200,
    occupancy_status ENUM('Occupied', 'Vacant') NOT NULL DEFAULT 'Occupied',
    FOREIGN KEY (wing_id) REFERENCES wings(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_wing_flat (wing_id, flat_number)
);

-- 3. Residents
CREATE TABLE residents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flat_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    resident_type ENUM('Owner', 'Tenant') NOT NULL DEFAULT 'Owner',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    emergency_contact VARCHAR(20),
    move_in_date DATE NOT NULL,
    FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE RESTRICT
);

-- 4. Maintenance Bills
CREATE TABLE maintenance_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flat_id INT NOT NULL,
    resident_id INT,
    billing_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    due_date DATE NOT NULL,
    base_maintenance DECIMAL(10,2) NOT NULL DEFAULT 3500.00,
    water_charges DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    parking_charges DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    late_fine DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('Paid', 'Pending', 'Overdue') NOT NULL DEFAULT 'Pending',
    payment_method ENUM('UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Cash', 'Cheque') NULL,
    paid_date DATE NULL,
    transaction_ref VARCHAR(100) NULL,
    FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL,
    UNIQUE KEY unique_flat_month (flat_id, billing_month),
    INDEX idx_payment_status (payment_status),
    INDEX idx_billing_month (billing_month)
);

-- 5. Complaints / Service Requests
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flat_id INT NOT NULL,
    resident_id INT NOT NULL,
    category ENUM('Plumbing', 'Electrical', 'Elevator', 'Security', 'Carpentry', 'Other') NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    status ENUM('Open', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Open',
    filed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
);
```

---

## 📊 20 Seed Records Overview

The seed dataset contains exactly **20 full records** across the society:
- **Flats**: 20 units distributed across **Wing A**, **Wing B**, and **Wing C**.
- **Residents**: 20 individuals (**14 Owners, 6 Tenants**) with Indian phone numbers, emails, and emergency contacts.
- **Maintenance Bills (October 2026 Cycle)**:
  - **Paid**: 13 bills (marked with transaction references & payment modes: UPI, Net Banking, Credit Card, Cash).
  - **Pending**: 4 bills (due within grace period).
  - **Overdue**: 3 bills (with late fine penalties applied).
- **Complaints**: 6 sample maintenance tickets with varying priorities (Elevator, Plumbing, Electrical, Security).

---

## 🚀 Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18 or newer)
- MySQL Server (v8.0+ running on `127.0.0.1:3306`)

### 1. Navigate to Presentation III
```bash
cd presentation_III
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Configure Database Credentials
Verify or update `.env` in `presentation_III/.env`:
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=residential_society_db
```

### 4. Initialize Database & Seed 20 Records
Run the automated schema and mock data runner:
```bash
npm run db:init
```
*Expected Output:*
```
Connected to MySQL server.
Database 'residential_society_db' ensured.
Executing schema.sql DDL statements...
Schema tables verified and created successfully.
Populating 20 Flats, 20 Residents, 20 Maintenance Bills, 6 Complaints...
Initialization complete: 20 mock records loaded into MySQL!
```

### 5. Start the Web Server
```bash
npm start
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🎯 Interactive Presentation Demonstration Guide

When presenting to evaluators, follow this workflow:

### Step 1: Society Overview & KPIs
1. Open the dashboard at `http://localhost:3000`.
2. Point out the **Summary Tiles**:
   - Total Monthly Demand vs. Collected vs. Pending.
   - Collection efficiency percentage gauge.
   - Total Flats (20), Occupied (20), Defaulter units (3).
3. Demonstrate the **Collapsible Navigation Rail**:
   - Click the sidebar toggle icon `[☰ / ◀]` to collapse to icon-only mode (78px width).
   - Click again to expand (275px width). State is preserved in `localStorage`.

### Step 2: "Mark as Paid" Live Demonstration
1. In the **Maintenance Billing Ledger**, filter by **"Pending"** or **"Overdue"**.
2. Locate any unpaid bill (e.g., Flat **B-201** or **C-302**).
3. Click the green **"Mark as Paid"** button.
4. In the modal:
   - Select payment mode (e.g., `UPI`, `Net Banking`, `Cash`).
   - Enter a Transaction ID (e.g., `UPI-DEMO-9988`).
   - Click **"Confirm & Record Payment"**.
5. Observe the live UI update:
   - The status immediately switches to **"Paid"** with a green badge.
   - The Collection KPI and pending counters update in real time.
   - The Defaulters card count decrements.

### Step 3: Interactive Society Map (Tower Visualization)
1. Switch to the **Society Map** section.
2. View the visual layout of **Wing A**, **Wing B**, and **Wing C**.
3. Flats color-code based on payment standing (Green = Paid, Amber = Pending, Red = Overdue).
4. Hover over any flat for resident details and click for quick actions.

### Step 4: Interactive DBMS SQL Console
1. Navigate to the **DBMS & SQL Console** tab in the UI.
2. Select any pre-configured relational query:
   - *Total Collection Summary by Payment Status*
   - *Active Defaulters List with Late Fine Computation*
   - *Owner vs. Tenant Breakdown by Wing*
3. Click **"Execute Query"**.
4. Show the evaluators:
   - The execution benchmark time (e.g., `3.2ms`).
   - The formatted dynamic result table rendered directly from MySQL.

---

## 💻 Direct MySQL CLI Verification Queries

To demonstrate DBMS verification directly in the terminal to your evaluators, run:

```bash
mysql -u root -p
```
```sql
USE residential_society_db;
```

### 1. Verify 20 Registered Flats
```sql
SELECT 
    w.name AS wing_name, 
    f.flat_number, 
    f.floor_number, 
    f.bhk_type, 
    f.occupancy_status 
FROM flats f
JOIN wings w ON f.wing_id = w.id
ORDER BY w.name, f.flat_number;
```

### 2. Verify 20 Residents and Their Tenancy
```sql
SELECT 
    r.id, 
    CONCAT(r.first_name, ' ', r.last_name) AS resident_name, 
    r.resident_type, 
    r.phone, 
    CONCAT(w.name, '-', f.flat_number) AS flat
FROM residents r
JOIN flats f ON r.flat_id = f.id
JOIN wings w ON f.wing_id = w.id
ORDER BY r.id;
```

### 3. Check All 20 Maintenance Bills & Payment Status
```sql
SELECT 
    b.id AS bill_id,
    CONCAT(w.name, '-', f.flat_number) AS flat,
    CONCAT(r.first_name, ' ', r.last_name) AS resident,
    b.billing_month,
    b.total_amount,
    b.payment_status,
    b.payment_method,
    b.paid_date,
    b.transaction_ref
FROM maintenance_bills b
JOIN flats f ON b.flat_id = f.id
JOIN wings w ON f.wing_id = w.id
LEFT JOIN residents r ON b.resident_id = r.id
ORDER BY b.id;
```

### 4. Query Only Defaulters (Overdue Accounts)
```sql
SELECT 
    CONCAT(w.name, '-', f.flat_number) AS flat,
    CONCAT(r.first_name, ' ', r.last_name) AS resident,
    r.phone,
    b.due_date,
    b.total_amount,
    b.late_fine
FROM maintenance_bills b
JOIN flats f ON b.flat_id = f.id
JOIN wings w ON f.wing_id = w.id
JOIN residents r ON b.resident_id = r.id
WHERE b.payment_status = 'Overdue';
```

### 5. Verify Newly Paid Record After Web Dashboard Action
```sql
SELECT 
    id, flat_id, payment_status, payment_method, paid_date, transaction_ref
FROM maintenance_bills
WHERE payment_status = 'Paid'
ORDER BY paid_date DESC
LIMIT 5;
```

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Verifies MySQL connection health and credentials state |
| `POST` | `/api/db/connect` | Connects or auto-initializes MySQL database with schema & mock seed |
| `GET` | `/api/stats` | Aggregated metrics (total flats, occupancy %, billed, collected, pending, defaulters) |
| `GET` | `/api/bills` | Retrieves maintenance bills (supports `status`, `month`, and `search` query filters) |
| `POST` | `/api/bills/pay` | Records payment: updates status to `Paid`, sets `paid_date`, `payment_method`, and `transaction_ref` |
| `GET` | `/api/residents` | Fetches resident records joined with flat and wing data |
| `POST` | `/api/residents` | Adds a resident into the database and updates flat occupancy status |
| `GET` | `/api/flats` | Lists flats grouped by wing/tower with occupancy and billing state |
| `GET` | `/api/complaints` | Lists maintenance and service tickets |
| `POST` | `/api/query` | Executes read-only queries from the interactive SQL console with benchmark timing |

---

## 📁 Directory Structure

```
presentation_III/
├── database/
│   ├── schema.sql         # Relational DDL (3NF normalized tables, keys, indexes)
│   ├── seed.sql           # DML seed with 20 flats, 20 residents, 20 bills
│   ├── mockData.json      # Resilient offline data snapshot
│   ├── db.js              # MySQL connection pool with parameterized queries
│   └── init.js            # Automated DB & table initialization CLI runner
├── server/
│   └── index.js           # Express REST API endpoints & static dashboard server
├── public/
│   ├── index.html         # Light-themed society dashboard
│   ├── style.css          # Design system with collapsible sidebar & glassmorphism
│   └── app.js             # Client controller, state management & SQL executor
├── .env                   # Database configuration
├── .env.example           # Environment template
├── package.json           # Dependencies and scripts
└── README.md              # Presentation III complete project guide
```

---

## 🎓 Academic Presentation Notes
- **Course**: Database Management Systems (DBMS)
- **Phase**: Presentation III (System Implementation & Working Demonstration)
- **Key DBMS Concepts Demonstrated**:
  - Relational Data Model & E-R Translation
  - 1NF, 2NF, 3NF Normalization
  - Foreign Key Constraints & Referential Integrity
  - Composite Unique Constraints
  - Index Optimization
  - Transactions & ACID updates (`Mark as Paid`)
  - Full-Stack Integration with MySQL 8.x
