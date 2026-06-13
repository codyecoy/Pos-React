import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import crypto from 'crypto'
import sql from 'mssql'
import path from 'path'
import fs from 'fs'

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

function getContext(req) {
  const tenantId = String(req.headers['x-tenant-id'] || req.body?.tenantId || 'DEFAULT')
  const storeId = String(req.headers['x-store-id'] || req.body?.storeId || 'DEFAULT')
  return { tenantId, storeId }
}

function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p })
      return
    }
  }

  dotenv.config()
}

loadEnv()

function getSqlConfig() {
  const port = Number(process.env.DB_PORT || 1433)
  const encrypt = String(process.env.DB_ENCRYPT || '').toLowerCase() === 'true'
  const trustServerCertificate = String(process.env.DB_TRUST_SERVER_CERT || '').toLowerCase() === 'true'

  return {
    server: process.env.DB_SERVER,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: {
      encrypt,
      trustServerCertificate,
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    connectionTimeout: 15000,
    requestTimeout: 30000,
  }
}

let poolPromise

async function getPool() {
  if (!poolPromise) {
    const cfg = getSqlConfig()
    poolPromise = sql.connect(cfg)
  }
  return poolPromise
}

async function ensureSchema() {
  const pool = await getPool()

  const statements = [
    `IF OBJECT_ID('dbo.tenants', 'U') IS NULL
      CREATE TABLE dbo.tenants (
        id NVARCHAR(64) NOT NULL PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_tenants_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_tenants_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL
      );`,

    `IF OBJECT_ID('dbo.stores', 'U') IS NULL
      CREATE TABLE dbo.stores (
        id NVARCHAR(64) NOT NULL PRIMARY KEY,
        tenantId NVARCHAR(64) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        address NVARCHAR(500) NULL,
        phone NVARCHAR(50) NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_stores_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_stores_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL
      );`,

    `IF OBJECT_ID('dbo.users', 'U') IS NULL
      CREATE TABLE dbo.users (
        id NVARCHAR(64) NOT NULL PRIMARY KEY,
        tenantId NVARCHAR(64) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        passwordHash NVARCHAR(512) NOT NULL,
        passwordSalt NVARCHAR(128) NOT NULL,
        passwordIters INT NOT NULL CONSTRAINT DF_users_passwordIters DEFAULT 100000,
        role NVARCHAR(20) NOT NULL CONSTRAINT DF_users_role DEFAULT 'admin',
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_users_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_users_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL
      );`,

    `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_users_email' AND object_id = OBJECT_ID('dbo.users'))
      CREATE UNIQUE INDEX UX_users_email ON dbo.users(email);`,

    `IF OBJECT_ID('dbo.master_products', 'U') IS NULL
      CREATE TABLE dbo.master_products (
        id NVARCHAR(64) NOT NULL PRIMARY KEY,
        segment NVARCHAR(50) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        category NVARCHAR(100) NOT NULL CONSTRAINT DF_master_products_category DEFAULT '',
        sku NVARCHAR(100) NOT NULL CONSTRAINT DF_master_products_sku DEFAULT '',
        barcode NVARCHAR(100) NOT NULL CONSTRAINT DF_master_products_barcode DEFAULT '',
        price DECIMAL(18,2) NOT NULL CONSTRAINT DF_master_products_price DEFAULT 0,
        costPrice DECIMAL(18,2) NOT NULL CONSTRAINT DF_master_products_costPrice DEFAULT 0,
        image NVARCHAR(MAX) NOT NULL CONSTRAINT DF_master_products_image DEFAULT '',
        status NVARCHAR(20) NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_master_products_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_master_products_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL
      );`,

    `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_master_products_segment' AND object_id = OBJECT_ID('dbo.master_products'))
      CREATE INDEX IX_master_products_segment ON dbo.master_products(segment);`,

    `IF NOT EXISTS (SELECT 1 FROM dbo.master_products)
      BEGIN
        INSERT INTO dbo.master_products (id, segment, name, category, sku, barcode, price, costPrice, image, status, createdAt, updatedAt, deletedAt)
        VALUES
          -- kelontong
          ('kelontong-001', 'kelontong', 'Beras Ramos 5kg', 'Sembako', 'KEL-001', '8990000000001', 78000, 72000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-002', 'kelontong', 'Gula Pasir 1kg', 'Sembako', 'KEL-002', '8990000000002', 17000, 15000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-003', 'kelontong', 'Minyak Goreng 1L', 'Sembako', 'KEL-003', '8990000000003', 19000, 17000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-004', 'kelontong', 'Telur Ayam 1kg', 'Sembako', 'KEL-004', '8990000000004', 32000, 29000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-005', 'kelontong', 'Indomie Goreng', 'Mie Instan', 'KEL-005', '8990000000005', 3500, 3000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-006', 'kelontong', 'Susu UHT 1L', 'Minuman', 'KEL-006', '8990000000006', 21000, 18500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-007', 'kelontong', 'Teh Celup 25', 'Minuman', 'KEL-007', '8990000000007', 12000, 10500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-008', 'kelontong', 'Kopi Sachet 10', 'Minuman', 'KEL-008', '8990000000008', 14000, 12000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-009', 'kelontong', 'Sabun Mandi 100g', 'Toiletries', 'KEL-009', '8990000000009', 4500, 3800, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-010', 'kelontong', 'Detergen 800g', 'Kebutuhan Rumah', 'KEL-010', '8990000000010', 21000, 19000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-011', 'kelontong', 'Pasta Gigi 120g', 'Toiletries', 'KEL-011', '8990000000011', 12500, 11000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('kelontong-012', 'kelontong', 'Air Mineral 600ml', 'Minuman', 'KEL-012', '8990000000012', 3500, 2500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),

          -- cafe
          ('cafe-001', 'cafe', 'Nasi Goreng', 'Makanan', 'CAF-001', '8990000000101', 25000, 12000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('cafe-002', 'cafe', 'Mie Goreng', 'Makanan', 'CAF-002', '8990000000102', 22000, 10500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('cafe-003', 'cafe', 'Ayam Geprek', 'Makanan', 'CAF-003', '8990000000103', 28000, 14000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('cafe-004', 'cafe', 'French Fries', 'Snack', 'CAF-004', '8990000000104', 18000, 7000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('cafe-005', 'cafe', 'Sosis Bakar', 'Snack', 'CAF-005', '8990000000105', 15000, 6500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('cafe-006', 'cafe', 'Teh Manis', 'Minuman', 'CAF-006', '8990000000106', 8000, 2500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('cafe-007', 'cafe', 'Teh Tawar', 'Minuman', 'CAF-007', '8990000000107', 5000, 1500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('cafe-008', 'cafe', 'Es Jeruk', 'Minuman', 'CAF-008', '8990000000108', 12000, 4500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('cafe-009', 'cafe', 'Lemon Tea', 'Minuman', 'CAF-009', '8990000000109', 13000, 5000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('cafe-010', 'cafe', 'Air Mineral', 'Minuman', 'CAF-010', '8990000000110', 6000, 2500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),

          -- coffee
          ('coffee-001', 'coffee', 'Espresso', 'Coffee', 'COF-001', '8990000000201', 18000, 7000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('coffee-002', 'coffee', 'Americano', 'Coffee', 'COF-002', '8990000000202', 20000, 8000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('coffee-003', 'coffee', 'Cappuccino', 'Coffee', 'COF-003', '8990000000203', 25000, 9500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('coffee-004', 'coffee', 'Cafe Latte', 'Coffee', 'COF-004', '8990000000204', 26000, 10000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('coffee-005', 'coffee', 'Caramel Latte', 'Coffee', 'COF-005', '8990000000205', 30000, 12000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('coffee-006', 'coffee', 'Mocha', 'Coffee', 'COF-006', '8990000000206', 30000, 12500, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('coffee-007', 'coffee', 'Matcha Latte', 'Non Coffee', 'COF-007', '8990000000207', 28000, 11000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('coffee-008', 'coffee', 'Chocolate', 'Non Coffee', 'COF-008', '8990000000208', 26000, 10000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('coffee-009', 'coffee', 'Tea (Hot/Ice)', 'Tea', 'COF-009', '8990000000209', 18000, 6000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL),
          ('coffee-010', 'coffee', 'Croissant', 'Pastry', 'COF-010', '8990000000210', 22000, 12000, '', 'Aktif', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL);
      END;`,

    `IF OBJECT_ID('dbo.products', 'U') IS NULL
      CREATE TABLE dbo.products (
        tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_products_tenantId DEFAULT 'DEFAULT',
        storeId NVARCHAR(64) NOT NULL CONSTRAINT DF_products_storeId DEFAULT 'DEFAULT',
        id NVARCHAR(64) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        price DECIMAL(18,2) NOT NULL CONSTRAINT DF_products_price DEFAULT 0,
        costPrice DECIMAL(18,2) NOT NULL CONSTRAINT DF_products_costPrice DEFAULT 0,
        stock INT NOT NULL CONSTRAINT DF_products_stock DEFAULT 0,
        category NVARCHAR(100) NOT NULL CONSTRAINT DF_products_category DEFAULT '',
        image NVARCHAR(MAX) NOT NULL CONSTRAINT DF_products_image DEFAULT '',
        barcode NVARCHAR(100) NOT NULL CONSTRAINT DF_products_barcode DEFAULT '',
        sku NVARCHAR(100) NOT NULL CONSTRAINT DF_products_sku DEFAULT '',
        status NVARCHAR(20) NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_products_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_products_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL,
        syncVersion INT NOT NULL CONSTRAINT DF_products_syncVersion DEFAULT 1,
        CONSTRAINT PK_products PRIMARY KEY (tenantId, storeId, id)
      );`,

    `IF OBJECT_ID('dbo.categories', 'U') IS NULL
      CREATE TABLE dbo.categories (
        tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_categories_tenantId DEFAULT 'DEFAULT',
        storeId NVARCHAR(64) NOT NULL CONSTRAINT DF_categories_storeId DEFAULT 'DEFAULT',
        id NVARCHAR(64) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        icon NVARCHAR(50) NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_categories_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_categories_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL,
        syncVersion INT NOT NULL CONSTRAINT DF_categories_syncVersion DEFAULT 1,
        CONSTRAINT PK_categories PRIMARY KEY (tenantId, storeId, id)
      );`,

    `IF OBJECT_ID('dbo.customers', 'U') IS NULL
      CREATE TABLE dbo.customers (
        tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_customers_tenantId DEFAULT 'DEFAULT',
        storeId NVARCHAR(64) NOT NULL CONSTRAINT DF_customers_storeId DEFAULT 'DEFAULT',
        id NVARCHAR(64) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50) NULL,
        email NVARCHAR(255) NULL,
        address NVARCHAR(500) NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_customers_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_customers_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL,
        syncVersion INT NOT NULL CONSTRAINT DF_customers_syncVersion DEFAULT 1,
        CONSTRAINT PK_customers PRIMARY KEY (tenantId, storeId, id)
      );`,

    `IF OBJECT_ID('dbo.suppliers', 'U') IS NULL
      CREATE TABLE dbo.suppliers (
        tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_suppliers_tenantId DEFAULT 'DEFAULT',
        storeId NVARCHAR(64) NOT NULL CONSTRAINT DF_suppliers_storeId DEFAULT 'DEFAULT',
        id NVARCHAR(64) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50) NULL,
        email NVARCHAR(255) NULL,
        address NVARCHAR(500) NULL,
        category NVARCHAR(100) NOT NULL CONSTRAINT DF_suppliers_category DEFAULT '',
        totalPurchased DECIMAL(18,2) NOT NULL CONSTRAINT DF_suppliers_totalPurchased DEFAULT 0,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_suppliers_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_suppliers_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL,
        syncVersion INT NOT NULL CONSTRAINT DF_suppliers_syncVersion DEFAULT 1,
        CONSTRAINT PK_suppliers PRIMARY KEY (tenantId, storeId, id)
      );`,

    `IF OBJECT_ID('dbo.transactions', 'U') IS NULL
      CREATE TABLE dbo.transactions (
        id NVARCHAR(64) NOT NULL PRIMARY KEY,
        tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_transactions_tenantId DEFAULT 'DEFAULT',
        storeId NVARCHAR(64) NOT NULL,
        cashierId NVARCHAR(64) NOT NULL,
        customerId NVARCHAR(64) NULL,
        timestamp DATETIME2 NOT NULL,
        subtotal DECIMAL(18,2) NOT NULL,
        tax DECIMAL(18,2) NOT NULL,
        discountTotal DECIMAL(18,2) NOT NULL CONSTRAINT DF_transactions_discountTotal DEFAULT 0,
        total DECIMAL(18,2) NOT NULL,
        paymentMethod NVARCHAR(20) NOT NULL,
        amountPaid DECIMAL(18,2) NOT NULL,
        changeAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_transactions_changeAmount DEFAULT 0,
        status NVARCHAR(20) NOT NULL,
        voidReason NVARCHAR(255) NULL,
        voidedAt DATETIME2 NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_transactions_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_transactions_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL,
        syncVersion INT NOT NULL CONSTRAINT DF_transactions_syncVersion DEFAULT 1
      );`,

    `IF OBJECT_ID('dbo.transaction_items', 'U') IS NULL
      CREATE TABLE dbo.transaction_items (
        id NVARCHAR(64) NOT NULL PRIMARY KEY,
        tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_tx_items_tenantId DEFAULT 'DEFAULT',
        storeId NVARCHAR(64) NOT NULL CONSTRAINT DF_tx_items_storeId DEFAULT 'DEFAULT',
        transactionId NVARCHAR(64) NOT NULL,
        productId NVARCHAR(64) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        sku NVARCHAR(100) NOT NULL CONSTRAINT DF_tx_items_sku DEFAULT '',
        barcode NVARCHAR(100) NOT NULL CONSTRAINT DF_tx_items_barcode DEFAULT '',
        category NVARCHAR(100) NOT NULL CONSTRAINT DF_tx_items_category DEFAULT '',
        price DECIMAL(18,2) NOT NULL,
        quantity INT NOT NULL,
        discount DECIMAL(18,2) NOT NULL CONSTRAINT DF_tx_items_discount DEFAULT 0,
        note NVARCHAR(255) NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_tx_items_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_tx_items_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL,
        syncVersion INT NOT NULL CONSTRAINT DF_tx_items_syncVersion DEFAULT 1,
        CONSTRAINT FK_tx_items_transaction FOREIGN KEY (transactionId) REFERENCES dbo.transactions(id) ON DELETE CASCADE
      );`,

    `IF OBJECT_ID('dbo.stock_movements', 'U') IS NULL
      CREATE TABLE dbo.stock_movements (
        id NVARCHAR(64) NOT NULL PRIMARY KEY,
        tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_stock_movements_tenantId DEFAULT 'DEFAULT',
        storeId NVARCHAR(64) NOT NULL,
        productId NVARCHAR(64) NOT NULL,
        transactionId NVARCHAR(64) NULL,
        type NVARCHAR(20) NOT NULL,
        quantityChange INT NOT NULL,
        reason NVARCHAR(255) NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_stock_movements_createdAt DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL CONSTRAINT DF_stock_movements_updatedAt DEFAULT SYSUTCDATETIME(),
        deletedAt DATETIME2 NULL,
        syncVersion INT NOT NULL CONSTRAINT DF_stock_movements_syncVersion DEFAULT 1
      );`,

    `IF OBJECT_ID('dbo.settings', 'U') IS NULL
      CREATE TABLE dbo.settings (
        [key] NVARCHAR(128) NOT NULL PRIMARY KEY,
        value NVARCHAR(MAX) NOT NULL,
        updatedAt DATETIME2 NOT NULL
      );`,

    `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tx_items_transactionId' AND object_id = OBJECT_ID('dbo.transaction_items'))
      CREATE INDEX IX_tx_items_transactionId ON dbo.transaction_items(transactionId);`,

    `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_products_barcode' AND object_id = OBJECT_ID('dbo.products'))
      CREATE INDEX IX_products_barcode ON dbo.products(barcode);`,

    `IF OBJECT_ID('dbo.products', 'U') IS NOT NULL AND COL_LENGTH('dbo.products','tenantId') IS NULL
      ALTER TABLE dbo.products ADD tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_products_tenantId DEFAULT 'DEFAULT';`,
    `IF OBJECT_ID('dbo.products', 'U') IS NOT NULL AND COL_LENGTH('dbo.products','storeId') IS NULL
      ALTER TABLE dbo.products ADD storeId NVARCHAR(64) NOT NULL CONSTRAINT DF_products_storeId DEFAULT 'DEFAULT';`,

    `IF OBJECT_ID('dbo.categories', 'U') IS NOT NULL AND COL_LENGTH('dbo.categories','tenantId') IS NULL
      ALTER TABLE dbo.categories ADD tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_categories_tenantId DEFAULT 'DEFAULT';`,
    `IF OBJECT_ID('dbo.categories', 'U') IS NOT NULL AND COL_LENGTH('dbo.categories','storeId') IS NULL
      ALTER TABLE dbo.categories ADD storeId NVARCHAR(64) NOT NULL CONSTRAINT DF_categories_storeId DEFAULT 'DEFAULT';`,

    `IF OBJECT_ID('dbo.customers', 'U') IS NOT NULL AND COL_LENGTH('dbo.customers','tenantId') IS NULL
      ALTER TABLE dbo.customers ADD tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_customers_tenantId DEFAULT 'DEFAULT';`,
    `IF OBJECT_ID('dbo.customers', 'U') IS NOT NULL AND COL_LENGTH('dbo.customers','storeId') IS NULL
      ALTER TABLE dbo.customers ADD storeId NVARCHAR(64) NOT NULL CONSTRAINT DF_customers_storeId DEFAULT 'DEFAULT';`,

    `IF OBJECT_ID('dbo.suppliers', 'U') IS NOT NULL AND COL_LENGTH('dbo.suppliers','tenantId') IS NULL
      ALTER TABLE dbo.suppliers ADD tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_suppliers_tenantId DEFAULT 'DEFAULT';`,
    `IF OBJECT_ID('dbo.suppliers', 'U') IS NOT NULL AND COL_LENGTH('dbo.suppliers','storeId') IS NULL
      ALTER TABLE dbo.suppliers ADD storeId NVARCHAR(64) NOT NULL CONSTRAINT DF_suppliers_storeId DEFAULT 'DEFAULT';`,

    `IF OBJECT_ID('dbo.products', 'U') IS NOT NULL
      BEGIN
        DECLARE @pkp sysname
        SELECT @pkp = kc.name
        FROM sys.key_constraints kc
        WHERE kc.parent_object_id = OBJECT_ID('dbo.products') AND kc.type = 'PK'

        IF @pkp IS NOT NULL AND EXISTS (
          SELECT 1
          FROM sys.key_constraints kc2
          JOIN sys.index_columns ic ON ic.object_id = kc2.parent_object_id AND ic.index_id = kc2.unique_index_id
          JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
          WHERE kc2.parent_object_id = OBJECT_ID('dbo.products') AND kc2.type = 'PK'
          GROUP BY kc2.name
          HAVING COUNT(*) <> 3 OR SUM(CASE WHEN c.name IN ('tenantId','storeId','id') THEN 1 ELSE 0 END) <> 3
        )
        BEGIN
          EXEC('ALTER TABLE dbo.products DROP CONSTRAINT [' + @pkp + ']')
          SET @pkp = NULL
        END

        IF @pkp IS NULL
          ALTER TABLE dbo.products ADD CONSTRAINT PK_products PRIMARY KEY (tenantId, storeId, id)
      END;`,

    `IF OBJECT_ID('dbo.categories', 'U') IS NOT NULL
      BEGIN
        DECLARE @pkc sysname
        SELECT @pkc = kc.name
        FROM sys.key_constraints kc
        WHERE kc.parent_object_id = OBJECT_ID('dbo.categories') AND kc.type = 'PK'

        IF @pkc IS NOT NULL AND EXISTS (
          SELECT 1
          FROM sys.key_constraints kc2
          JOIN sys.index_columns ic ON ic.object_id = kc2.parent_object_id AND ic.index_id = kc2.unique_index_id
          JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
          WHERE kc2.parent_object_id = OBJECT_ID('dbo.categories') AND kc2.type = 'PK'
          GROUP BY kc2.name
          HAVING COUNT(*) <> 3 OR SUM(CASE WHEN c.name IN ('tenantId','storeId','id') THEN 1 ELSE 0 END) <> 3
        )
        BEGIN
          EXEC('ALTER TABLE dbo.categories DROP CONSTRAINT [' + @pkc + ']')
          SET @pkc = NULL
        END

        IF @pkc IS NULL
          ALTER TABLE dbo.categories ADD CONSTRAINT PK_categories PRIMARY KEY (tenantId, storeId, id)
      END;`,

    `IF OBJECT_ID('dbo.customers', 'U') IS NOT NULL
      BEGIN
        DECLARE @pkcu sysname
        SELECT @pkcu = kc.name
        FROM sys.key_constraints kc
        WHERE kc.parent_object_id = OBJECT_ID('dbo.customers') AND kc.type = 'PK'

        IF @pkcu IS NOT NULL AND EXISTS (
          SELECT 1
          FROM sys.key_constraints kc2
          JOIN sys.index_columns ic ON ic.object_id = kc2.parent_object_id AND ic.index_id = kc2.unique_index_id
          JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
          WHERE kc2.parent_object_id = OBJECT_ID('dbo.customers') AND kc2.type = 'PK'
          GROUP BY kc2.name
          HAVING COUNT(*) <> 3 OR SUM(CASE WHEN c.name IN ('tenantId','storeId','id') THEN 1 ELSE 0 END) <> 3
        )
        BEGIN
          EXEC('ALTER TABLE dbo.customers DROP CONSTRAINT [' + @pkcu + ']')
          SET @pkcu = NULL
        END

        IF @pkcu IS NULL
          ALTER TABLE dbo.customers ADD CONSTRAINT PK_customers PRIMARY KEY (tenantId, storeId, id)
      END;`,

    `IF OBJECT_ID('dbo.suppliers', 'U') IS NOT NULL
      BEGIN
        DECLARE @pks sysname
        SELECT @pks = kc.name
        FROM sys.key_constraints kc
        WHERE kc.parent_object_id = OBJECT_ID('dbo.suppliers') AND kc.type = 'PK'

        IF @pks IS NOT NULL AND EXISTS (
          SELECT 1
          FROM sys.key_constraints kc2
          JOIN sys.index_columns ic ON ic.object_id = kc2.parent_object_id AND ic.index_id = kc2.unique_index_id
          JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
          WHERE kc2.parent_object_id = OBJECT_ID('dbo.suppliers') AND kc2.type = 'PK'
          GROUP BY kc2.name
          HAVING COUNT(*) <> 3 OR SUM(CASE WHEN c.name IN ('tenantId','storeId','id') THEN 1 ELSE 0 END) <> 3
        )
        BEGIN
          EXEC('ALTER TABLE dbo.suppliers DROP CONSTRAINT [' + @pks + ']')
          SET @pks = NULL
        END

        IF @pks IS NULL
          ALTER TABLE dbo.suppliers ADD CONSTRAINT PK_suppliers PRIMARY KEY (tenantId, storeId, id)
      END;`,

    `IF OBJECT_ID('dbo.transactions', 'U') IS NOT NULL AND COL_LENGTH('dbo.transactions','tenantId') IS NULL
      ALTER TABLE dbo.transactions ADD tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_transactions_tenantId DEFAULT 'DEFAULT';`,

    `IF OBJECT_ID('dbo.transaction_items', 'U') IS NOT NULL AND COL_LENGTH('dbo.transaction_items','tenantId') IS NULL
      ALTER TABLE dbo.transaction_items ADD tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_tx_items_tenantId DEFAULT 'DEFAULT';`,
    `IF OBJECT_ID('dbo.transaction_items', 'U') IS NOT NULL AND COL_LENGTH('dbo.transaction_items','storeId') IS NULL
      ALTER TABLE dbo.transaction_items ADD storeId NVARCHAR(64) NOT NULL CONSTRAINT DF_tx_items_storeId DEFAULT 'DEFAULT';`,

    `IF OBJECT_ID('dbo.stock_movements', 'U') IS NOT NULL AND COL_LENGTH('dbo.stock_movements','tenantId') IS NULL
      ALTER TABLE dbo.stock_movements ADD tenantId NVARCHAR(64) NOT NULL CONSTRAINT DF_stock_movements_tenantId DEFAULT 'DEFAULT';`,

    `IF OBJECT_ID('dbo.products', 'U') IS NOT NULL AND EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.products')
          AND name = 'image'
          AND max_length <> -1
      )
      BEGIN
        DECLARE @df sysname
        SELECT @df = dc.name
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c
          ON c.default_object_id = dc.object_id
        WHERE dc.parent_object_id = OBJECT_ID('dbo.products')
          AND c.name = 'image'

        IF @df IS NOT NULL
          EXEC('ALTER TABLE dbo.products DROP CONSTRAINT [' + @df + ']')

        ALTER TABLE dbo.products ALTER COLUMN image NVARCHAR(MAX) NOT NULL

        IF NOT EXISTS (
          SELECT 1
          FROM sys.default_constraints dc2
          INNER JOIN sys.columns c2
            ON c2.default_object_id = dc2.object_id
          WHERE dc2.parent_object_id = OBJECT_ID('dbo.products')
            AND c2.name = 'image'
        )
          ALTER TABLE dbo.products ADD CONSTRAINT DF_products_image DEFAULT '' FOR image
      END;`,
  ]

  for (const stmt of statements) {
    await pool.request().query(stmt)
  }
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return crypto.randomBytes(16).toString('hex')
}

function hashPassword(password, salt, iters) {
  const iterations = Number(iters || 100000)
  const s = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(String(password), s, iterations, 32, 'sha256').toString('hex')
  return { salt: s, hash, iterations }
}

function verifyPassword(password, salt, iters, hash) {
  const computed = crypto.pbkdf2Sync(String(password), String(salt), Number(iters || 100000), 32, 'sha256').toString('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(String(hash), 'hex'))
  } catch {
    return false
  }
}

app.get('/health', async (_req, res) => {
  try {
    await ensureSchema()
    const pool = await getPool()
    const result = await pool.request().query('SELECT 1 AS ok')
    res.json({ ok: true, db: result.recordset?.[0]?.ok === 1 })
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e?.message || e) })
  }
})

app.get('/master/products', async (req, res) => {
  try {
    await ensureSchema()
    const segment = String(req.query?.segment || '').trim().toLowerCase()
    if (!segment) return res.status(400).json({ message: 'segment wajib diisi' })

    const pool = await getPool()
    const result = await pool
      .request()
      .input('segment', sql.NVarChar(50), segment)
      .query(`
        SELECT id, segment, name, category, sku, barcode, price, costPrice, image, status
        FROM dbo.master_products
        WHERE deletedAt IS NULL AND segment = @segment
        ORDER BY name ASC
      `)
    res.json(result.recordset)
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.post('/auth/register', async (req, res) => {
  try {
    await ensureSchema()
    const name = String(req.body?.name || '').trim()
    const storeName = String(req.body?.storeName || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')

    if (!name || !storeName || !email || !password) {
      return res.status(400).json({ message: 'name, storeName, email, password wajib diisi' })
    }

    const pool = await getPool()
    const exists = await pool.request().input('email', sql.NVarChar(255), email).query(
      `SELECT TOP 1 id FROM dbo.users WHERE email = @email AND deletedAt IS NULL`
    )
    if (exists.recordset.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar' })
    }

    const tenantId = createId()
    const storeId = createId()
    const userId = createId()
    const pw = hashPassword(password)

    const tx = new sql.Transaction(pool)
    await tx.begin()
    try {
      await new sql.Request(tx)
        .input('id', sql.NVarChar(64), tenantId)
        .input('name', sql.NVarChar(255), storeName)
        .query(`INSERT INTO dbo.tenants (id, name, createdAt, updatedAt, deletedAt) VALUES (@id, @name, SYSUTCDATETIME(), SYSUTCDATETIME(), NULL)`)

      await new sql.Request(tx)
        .input('id', sql.NVarChar(64), storeId)
        .input('tenantId', sql.NVarChar(64), tenantId)
        .input('name', sql.NVarChar(255), storeName)
        .query(`INSERT INTO dbo.stores (id, tenantId, name, address, phone, createdAt, updatedAt, deletedAt) VALUES (@id, @tenantId, @name, '', '', SYSUTCDATETIME(), SYSUTCDATETIME(), NULL)`)

      await new sql.Request(tx)
        .input('id', sql.NVarChar(64), userId)
        .input('tenantId', sql.NVarChar(64), tenantId)
        .input('name', sql.NVarChar(255), name)
        .input('email', sql.NVarChar(255), email)
        .input('passwordHash', sql.NVarChar(512), pw.hash)
        .input('passwordSalt', sql.NVarChar(128), pw.salt)
        .input('passwordIters', sql.Int, pw.iterations)
        .input('role', sql.NVarChar(20), 'admin')
        .query(`
          INSERT INTO dbo.users (id, tenantId, name, email, passwordHash, passwordSalt, passwordIters, role, createdAt, updatedAt, deletedAt)
          VALUES (@id, @tenantId, @name, @email, @passwordHash, @passwordSalt, @passwordIters, @role, SYSUTCDATETIME(), SYSUTCDATETIME(), NULL)
        `)

      await tx.commit()

      res.json({
        user: { id: userId, tenantId, name, role: 'admin' },
        stores: [{ id: storeId, name: storeName, address: '', phone: '' }],
        token: createId(),
      })
    } catch (e) {
      await tx.rollback()
      res.status(500).json({ message: String(e?.message || e) })
    }
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    await ensureSchema()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    if (!email || !password) return res.status(400).json({ message: 'email dan password wajib diisi' })

    const pool = await getPool()
    const result = await pool.request().input('email', sql.NVarChar(255), email).query(
      `SELECT TOP 1 id, tenantId, name, email, passwordHash, passwordSalt, passwordIters, role
       FROM dbo.users
       WHERE email = @email AND deletedAt IS NULL`
    )
    if (result.recordset.length === 0) return res.status(401).json({ message: 'Email atau password salah' })

    const row = result.recordset[0]
    const ok = verifyPassword(password, row.passwordSalt, row.passwordIters, row.passwordHash)
    if (!ok) return res.status(401).json({ message: 'Email atau password salah' })

    const stores = await pool.request().input('tenantId', sql.NVarChar(64), row.tenantId).query(
      `SELECT id, name, address, phone FROM dbo.stores WHERE tenantId = @tenantId AND deletedAt IS NULL ORDER BY createdAt ASC`
    )

    res.json({
      user: { id: String(row.id), tenantId: String(row.tenantId), name: String(row.name), role: String(row.role || 'admin') },
      stores: stores.recordset || [],
      token: createId(),
    })
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.get('/stores', async (req, res) => {
  try {
    await ensureSchema()
    const { tenantId } = getContext(req)
    const pool = await getPool()
    const result = await pool
      .request()
      .input('tenantId', sql.NVarChar(64), tenantId)
      .query(`SELECT id, name, address, phone FROM dbo.stores WHERE tenantId = @tenantId AND deletedAt IS NULL ORDER BY createdAt ASC`)
    res.json(result.recordset)
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.post('/stores', async (req, res) => {
  try {
    await ensureSchema()
    const { tenantId } = getContext(req)
    const name = String(req.body?.name || '').trim()
    const address = String(req.body?.address || '').trim()
    const phone = String(req.body?.phone || '').trim()
    if (!name) return res.status(400).json({ message: 'name wajib diisi' })

    const pool = await getPool()
    const exists = await pool
      .request()
      .input('tenantId', sql.NVarChar(64), tenantId)
      .query(`SELECT TOP 1 id FROM dbo.tenants WHERE id = @tenantId AND deletedAt IS NULL`)
    if (exists.recordset.length === 0) return res.status(400).json({ message: 'tenant tidak ditemukan' })

    const id = createId()
    await pool
      .request()
      .input('id', sql.NVarChar(64), id)
      .input('tenantId', sql.NVarChar(64), tenantId)
      .input('name', sql.NVarChar(255), name)
      .input('address', sql.NVarChar(500), address)
      .input('phone', sql.NVarChar(50), phone)
      .query(`
        INSERT INTO dbo.stores (id, tenantId, name, address, phone, createdAt, updatedAt, deletedAt)
        VALUES (@id, @tenantId, @name, @address, @phone, SYSUTCDATETIME(), SYSUTCDATETIME(), NULL)
      `)

    res.json({ id, name, address, phone })
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.get('/products', async (_req, res) => {
  try {
    await ensureSchema()
    const { tenantId, storeId } = getContext(_req)
    const pool = await getPool()
    const result = await pool
      .request()
      .input('tenantId', sql.NVarChar(64), tenantId)
      .input('storeId', sql.NVarChar(64), storeId)
      .query(`
        SELECT id, name, price, costPrice, stock, category, image, barcode, sku, status, createdAt, updatedAt, deletedAt, syncVersion
        FROM dbo.products
        WHERE deletedAt IS NULL AND tenantId = @tenantId AND storeId = @storeId
        ORDER BY updatedAt DESC
      `)
    res.json(result.recordset)
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.get('/categories', async (_req, res) => {
  try {
    await ensureSchema()
    const { tenantId, storeId } = getContext(_req)
    const pool = await getPool()
    const result = await pool
      .request()
      .input('tenantId', sql.NVarChar(64), tenantId)
      .input('storeId', sql.NVarChar(64), storeId)
      .query(`
        SELECT id, name, icon, createdAt, updatedAt, deletedAt, syncVersion
        FROM dbo.categories
        WHERE deletedAt IS NULL AND tenantId = @tenantId AND storeId = @storeId
        ORDER BY name ASC
      `)
    res.json(result.recordset)
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.get('/customers', async (_req, res) => {
  try {
    await ensureSchema()
    const { tenantId, storeId } = getContext(_req)
    const pool = await getPool()
    const result = await pool
      .request()
      .input('tenantId', sql.NVarChar(64), tenantId)
      .input('storeId', sql.NVarChar(64), storeId)
      .query(`
        SELECT id, name, phone, email, address, createdAt, updatedAt, deletedAt, syncVersion
        FROM dbo.customers
        WHERE deletedAt IS NULL AND tenantId = @tenantId AND storeId = @storeId
        ORDER BY updatedAt DESC
      `)
    res.json(result.recordset)
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.get('/suppliers', async (_req, res) => {
  try {
    await ensureSchema()
    const { tenantId, storeId } = getContext(_req)
    const pool = await getPool()
    const result = await pool
      .request()
      .input('tenantId', sql.NVarChar(64), tenantId)
      .input('storeId', sql.NVarChar(64), storeId)
      .query(`
        SELECT id, name, phone, email, address, category, totalPurchased, createdAt, updatedAt, deletedAt, syncVersion
        FROM dbo.suppliers
        WHERE deletedAt IS NULL AND tenantId = @tenantId AND storeId = @storeId
        ORDER BY updatedAt DESC
      `)
    res.json(result.recordset)
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.post('/categories/sync', async (req, res) => {
  try {
    await ensureSchema()
    const { categories } = req.body || {}
    if (!Array.isArray(categories)) return res.status(400).json({ message: 'categories harus array' })

    const { tenantId, storeId } = getContext(req)
    const pool = await getPool()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
      for (const c of categories) {
        const id = String(c.id || '')
        if (!id) continue

        const deletedAt = c.deletedAt ? new Date(c.deletedAt) : null
        const syncVersion = Number(c.syncVersion || 1)

        await new sql.Request(tx)
          .input('id', sql.NVarChar(64), id)
          .input('tenantId', sql.NVarChar(64), tenantId)
          .input('storeId', sql.NVarChar(64), storeId)
          .input('name', sql.NVarChar(100), String(c.name || id))
          .input('icon', sql.NVarChar(50), c.icon ? String(c.icon) : null)
          .input('deletedAt', sql.DateTime2, deletedAt)
          .input('syncVersion', sql.Int, syncVersion)
          .query(`
            MERGE dbo.categories AS target
            USING (SELECT @id AS id, @tenantId AS tenantId, @storeId AS storeId) AS src
              ON target.id = src.id AND target.tenantId = src.tenantId AND target.storeId = src.storeId
            WHEN MATCHED THEN UPDATE SET
              name = @name,
              icon = @icon,
              deletedAt = @deletedAt,
              updatedAt = SYSUTCDATETIME(),
              syncVersion = CASE WHEN target.syncVersion < @syncVersion THEN @syncVersion ELSE target.syncVersion END
            WHEN NOT MATCHED THEN INSERT
              (id, tenantId, storeId, name, icon, createdAt, updatedAt, deletedAt, syncVersion)
            VALUES
              (@id, @tenantId, @storeId, @name, @icon, SYSUTCDATETIME(), SYSUTCDATETIME(), @deletedAt, @syncVersion);
          `)
      }

      await tx.commit()
      res.json({ ok: true })
    } catch (e) {
      await tx.rollback()
      res.status(500).json({ message: String(e?.message || e) })
    }
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.post('/customers/sync', async (req, res) => {
  try {
    await ensureSchema()
    const { customers } = req.body || {}
    if (!Array.isArray(customers)) return res.status(400).json({ message: 'customers harus array' })

    const { tenantId, storeId } = getContext(req)
    const pool = await getPool()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
      for (const c of customers) {
        const id = String(c.id || '')
        if (!id) continue

        const deletedAt = c.deletedAt ? new Date(c.deletedAt) : null
        const syncVersion = Number(c.syncVersion || 1)

        await new sql.Request(tx)
          .input('id', sql.NVarChar(64), id)
          .input('tenantId', sql.NVarChar(64), tenantId)
          .input('storeId', sql.NVarChar(64), storeId)
          .input('name', sql.NVarChar(255), String(c.name || ''))
          .input('phone', sql.NVarChar(50), c.phone ? String(c.phone) : null)
          .input('email', sql.NVarChar(255), c.email ? String(c.email) : null)
          .input('address', sql.NVarChar(500), c.address ? String(c.address) : null)
          .input('deletedAt', sql.DateTime2, deletedAt)
          .input('syncVersion', sql.Int, syncVersion)
          .query(`
            MERGE dbo.customers AS target
            USING (SELECT @id AS id, @tenantId AS tenantId, @storeId AS storeId) AS src
              ON target.id = src.id AND target.tenantId = src.tenantId AND target.storeId = src.storeId
            WHEN MATCHED THEN UPDATE SET
              name = @name,
              phone = @phone,
              email = @email,
              address = @address,
              deletedAt = @deletedAt,
              updatedAt = SYSUTCDATETIME(),
              syncVersion = CASE WHEN target.syncVersion < @syncVersion THEN @syncVersion ELSE target.syncVersion END
            WHEN NOT MATCHED THEN INSERT
              (id, tenantId, storeId, name, phone, email, address, createdAt, updatedAt, deletedAt, syncVersion)
            VALUES
              (@id, @tenantId, @storeId, @name, @phone, @email, @address, SYSUTCDATETIME(), SYSUTCDATETIME(), @deletedAt, @syncVersion);
          `)
      }

      await tx.commit()
      res.json({ ok: true })
    } catch (e) {
      await tx.rollback()
      res.status(500).json({ message: String(e?.message || e) })
    }
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.post('/suppliers/sync', async (req, res) => {
  try {
    await ensureSchema()
    const { suppliers } = req.body || {}
    if (!Array.isArray(suppliers)) return res.status(400).json({ message: 'suppliers harus array' })

    const { tenantId, storeId } = getContext(req)
    const pool = await getPool()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
      for (const s of suppliers) {
        const id = String(s.id || '')
        if (!id) continue

        const deletedAt = s.deletedAt ? new Date(s.deletedAt) : null
        const syncVersion = Number(s.syncVersion || 1)

        await new sql.Request(tx)
          .input('id', sql.NVarChar(64), id)
          .input('tenantId', sql.NVarChar(64), tenantId)
          .input('storeId', sql.NVarChar(64), storeId)
          .input('name', sql.NVarChar(255), String(s.name || ''))
          .input('phone', sql.NVarChar(50), s.phone ? String(s.phone) : null)
          .input('email', sql.NVarChar(255), s.email ? String(s.email) : null)
          .input('address', sql.NVarChar(500), s.address ? String(s.address) : null)
          .input('category', sql.NVarChar(100), String(s.category || ''))
          .input('totalPurchased', sql.Decimal(18, 2), Number(s.totalPurchased || 0))
          .input('deletedAt', sql.DateTime2, deletedAt)
          .input('syncVersion', sql.Int, syncVersion)
          .query(`
            MERGE dbo.suppliers AS target
            USING (SELECT @id AS id, @tenantId AS tenantId, @storeId AS storeId) AS src
              ON target.id = src.id AND target.tenantId = src.tenantId AND target.storeId = src.storeId
            WHEN MATCHED THEN UPDATE SET
              name = @name,
              phone = @phone,
              email = @email,
              address = @address,
              category = @category,
              totalPurchased = @totalPurchased,
              deletedAt = @deletedAt,
              updatedAt = SYSUTCDATETIME(),
              syncVersion = CASE WHEN target.syncVersion < @syncVersion THEN @syncVersion ELSE target.syncVersion END
            WHEN NOT MATCHED THEN INSERT
              (id, tenantId, storeId, name, phone, email, address, category, totalPurchased, createdAt, updatedAt, deletedAt, syncVersion)
            VALUES
              (@id, @tenantId, @storeId, @name, @phone, @email, @address, @category, @totalPurchased, SYSUTCDATETIME(), SYSUTCDATETIME(), @deletedAt, @syncVersion);
          `)
      }

      await tx.commit()
      res.json({ ok: true })
    } catch (e) {
      await tx.rollback()
      res.status(500).json({ message: String(e?.message || e) })
    }
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.post('/products/sync', async (req, res) => {
  try {
    await ensureSchema()
    const { products } = req.body || {}
    if (!Array.isArray(products)) return res.status(400).json({ message: 'products harus array' })

    const { tenantId, storeId } = getContext(req)
    const pool = await getPool()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
      for (const p of products) {
        const id = String(p.id || '')
        if (!id) continue

        const deletedAt = p.deletedAt ? new Date(p.deletedAt) : null
        const syncVersion = Number(p.syncVersion || 1)

        await new sql.Request(tx)
          .input('id', sql.NVarChar(64), id)
          .input('tenantId', sql.NVarChar(64), tenantId)
          .input('storeId', sql.NVarChar(64), storeId)
          .input('name', sql.NVarChar(255), String(p.name || ''))
          .input('price', sql.Decimal(18, 2), Number(p.price || 0))
          .input('costPrice', sql.Decimal(18, 2), Number(p.costPrice || 0))
          .input('stock', sql.Int, Number(p.stock || 0))
          .input('category', sql.NVarChar(100), String(p.category || ''))
          .input('image', sql.NVarChar(sql.MAX), String(p.image || ''))
          .input('barcode', sql.NVarChar(100), String(p.barcode || ''))
          .input('sku', sql.NVarChar(100), String(p.sku || ''))
          .input('status', sql.NVarChar(20), p.status ? String(p.status) : null)
          .input('deletedAt', sql.DateTime2, deletedAt)
          .input('syncVersion', sql.Int, syncVersion)
          .query(`
            MERGE dbo.products AS target
            USING (SELECT @id AS id, @tenantId AS tenantId, @storeId AS storeId) AS src
              ON target.id = src.id AND target.tenantId = src.tenantId AND target.storeId = src.storeId
            WHEN MATCHED THEN UPDATE SET
              name = @name,
              price = @price,
              costPrice = @costPrice,
              stock = @stock,
              category = @category,
              image = @image,
              barcode = @barcode,
              sku = @sku,
              status = @status,
              deletedAt = @deletedAt,
              updatedAt = SYSUTCDATETIME(),
              syncVersion = CASE WHEN target.syncVersion < @syncVersion THEN @syncVersion ELSE target.syncVersion END
            WHEN NOT MATCHED THEN INSERT
              (id, tenantId, storeId, name, price, costPrice, stock, category, image, barcode, sku, status, createdAt, updatedAt, deletedAt, syncVersion)
            VALUES
              (@id, @tenantId, @storeId, @name, @price, @costPrice, @stock, @category, @image, @barcode, @sku, @status, SYSUTCDATETIME(), SYSUTCDATETIME(), @deletedAt, @syncVersion);
          `)
      }

      await tx.commit()
      res.json({ ok: true })
    } catch (e) {
      await tx.rollback()
      res.status(500).json({ message: String(e?.message || e) })
    }
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

app.post('/transactions/sync', async (req, res) => {
  try {
    await ensureSchema()
    const { transactions } = req.body || {}
    if (!Array.isArray(transactions)) return res.status(400).json({ message: 'transactions harus array' })

    const { tenantId, storeId } = getContext(req)
    const pool = await getPool()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
      for (const t of transactions) {
        const exists = await new sql.Request(tx)
          .input('id', sql.NVarChar(64), t.id)
          .input('tenantId', sql.NVarChar(64), tenantId)
          .input('storeId', sql.NVarChar(64), String(t.storeId || storeId || 'DEFAULT'))
          .query('SELECT TOP 1 id FROM dbo.transactions WHERE id = @id AND tenantId = @tenantId AND storeId = @storeId')

        if (exists.recordset.length > 0) continue

        const timestamp = t.timestamp ? new Date(t.timestamp) : new Date()
        const txStoreId = String(t.storeId || storeId || 'DEFAULT')

        await new sql.Request(tx)
          .input('id', sql.NVarChar(64), t.id)
          .input('tenantId', sql.NVarChar(64), tenantId)
          .input('storeId', sql.NVarChar(64), txStoreId)
          .input('cashierId', sql.NVarChar(64), t.cashierId || 'SYSTEM')
          .input('customerId', sql.NVarChar(64), t.customerId || null)
          .input('timestamp', sql.DateTime2, timestamp)
          .input('subtotal', sql.Decimal(18, 2), Number(t.subtotal || 0))
          .input('tax', sql.Decimal(18, 2), Number(t.tax || 0))
          .input('discountTotal', sql.Decimal(18, 2), Number(t.discountTotal || 0))
          .input('total', sql.Decimal(18, 2), Number(t.total || 0))
          .input('paymentMethod', sql.NVarChar(20), String(t.paymentMethod || 'cash'))
          .input('amountPaid', sql.Decimal(18, 2), Number(t.amountPaid || 0))
          .input('changeAmount', sql.Decimal(18, 2), Number(t.change || 0))
          .input('status', sql.NVarChar(20), String(t.status || 'completed'))
          .query(`
            INSERT INTO dbo.transactions
              (id, tenantId, storeId, cashierId, customerId, timestamp, subtotal, tax, discountTotal, total, paymentMethod, amountPaid, changeAmount, status, createdAt, updatedAt, deletedAt, syncVersion)
            VALUES
              (@id, @tenantId, @storeId, @cashierId, @customerId, @timestamp, @subtotal, @tax, @discountTotal, @total, @paymentMethod, @amountPaid, @changeAmount, @status, SYSUTCDATETIME(), SYSUTCDATETIME(), NULL, 1)
          `)

        const items = Array.isArray(t.items) ? t.items : []

        for (const it of items) {
          const itemId = it.id || `${t.id}-${it.productId}-${Math.random().toString(16).slice(2)}`

          await new sql.Request(tx)
            .input('id', sql.NVarChar(64), itemId)
            .input('tenantId', sql.NVarChar(64), tenantId)
            .input('storeId', sql.NVarChar(64), txStoreId)
            .input('transactionId', sql.NVarChar(64), t.id)
            .input('productId', sql.NVarChar(64), String(it.productId || it.id || ''))
            .input('name', sql.NVarChar(255), String(it.name || ''))
            .input('sku', sql.NVarChar(100), String(it.sku || ''))
            .input('barcode', sql.NVarChar(100), String(it.barcode || ''))
            .input('category', sql.NVarChar(100), String(it.category || ''))
            .input('price', sql.Decimal(18, 2), Number(it.price || 0))
            .input('quantity', sql.Int, Number(it.quantity || 0))
            .input('discount', sql.Decimal(18, 2), Number(it.discount || 0))
            .input('note', sql.NVarChar(255), it.note ? String(it.note) : null)
            .query(`
              INSERT INTO dbo.transaction_items
                (id, tenantId, storeId, transactionId, productId, name, sku, barcode, category, price, quantity, discount, note, createdAt, updatedAt, deletedAt, syncVersion)
              VALUES
                (@id, @tenantId, @storeId, @transactionId, @productId, @name, @sku, @barcode, @category, @price, @quantity, @discount, @note, SYSUTCDATETIME(), SYSUTCDATETIME(), NULL, 1)
            `)

          await new sql.Request(tx)
            .input('tenantId', sql.NVarChar(64), tenantId)
            .input('storeId', sql.NVarChar(64), txStoreId)
            .input('productId', sql.NVarChar(64), String(it.productId || it.id || ''))
            .input('quantity', sql.Int, Number(it.quantity || 0))
            .query(`
              UPDATE dbo.products
              SET stock = stock - @quantity, updatedAt = SYSUTCDATETIME()
              WHERE id = @productId AND tenantId = @tenantId AND storeId = @storeId
            `)
        }
      }

      await tx.commit()
      res.json({ ok: true })
    } catch (e) {
      await tx.rollback()
      res.status(500).json({ message: String(e?.message || e) })
    }
  } catch (e) {
    res.status(500).json({ message: String(e?.message || e) })
  }
})

const port = Number(process.env.PORT || 3001)

app.listen(port, () => {
  console.log(`POS API listening on http://localhost:${port}`)
})

