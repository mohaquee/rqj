-- ════════════════════════════════════════════════════════════════════
-- Ruhul Quddus & Jurists — Practice Management Database Schema
-- ════════════════════════════════════════════════════════════════════
-- Run this once to create all tables. Idempotent — safe to re-run.
--
-- Usage:
--   sudo -u postgres createdb rqj_db
--   sudo -u postgres psql rqj_db < schema.sql
-- ════════════════════════════════════════════════════════════════════

-- ─── EMPLOYEES (catalog of all firm staff; hardcoded list of 14) ──────
CREATE TABLE IF NOT EXISTS employees (
    id           VARCHAR(20) PRIMARY KEY,        -- "e1", "e2", ... "e14"
    name         VARCHAR(120) NOT NULL,
    short_name   VARCHAR(60)  NOT NULL,
    role         VARCHAR(80)  NOT NULL,
    tier         VARCHAR(40)  NOT NULL,
    category     VARCHAR(20)  NOT NULL,          -- head/senior/associate/research/support
    avatar       VARCHAR(8)   NOT NULL
);

-- ─── USERS (login credentials, mapped to employees) ───────────────────
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(40) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,  -- bcrypt
    employee_id   VARCHAR(20)         NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    role          VARCHAR(20)         NOT NULL CHECK (role IN ('director','employee')),
    display_name  VARCHAR(120)        NOT NULL,
    display_role  VARCHAR(80)         NOT NULL,
    is_active     BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ─── CLIENTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    address     TEXT,
    contact     VARCHAR(120),
    email       VARCHAR(120),
    phone       VARCHAR(40),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- ─── INVOICES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no      VARCHAR(40)  UNIQUE NOT NULL,
    client_id       UUID         NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    client_name     VARCHAR(200) NOT NULL,    -- denormalized for quick display
    issue_date      DATE         NOT NULL,
    amount          BIGINT       NOT NULL CHECK (amount >= 0),
    paid            BIGINT       NOT NULL DEFAULT 0 CHECK (paid >= 0),
    outstanding     BIGINT       NOT NULL CHECK (outstanding >= 0),
    status          VARCHAR(20)  NOT NULL CHECK (status IN ('sent','outstanding','overdue','paid')),
    month           INTEGER      NOT NULL CHECK (month BETWEEN 0 AND 11),
    year            INTEGER      NOT NULL,
    created_by      INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id  ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_year_month ON invoices(year, month);

-- ─── INVOICE LINE ITEMS (one invoice has many items) ──────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id   UUID         NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description  TEXT         NOT NULL,
    employee_id  VARCHAR(20)  REFERENCES employees(id) ON DELETE SET NULL,
    amount       BIGINT       NOT NULL CHECK (amount >= 0),
    sort_order   INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id  ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_employee_id ON invoice_items(employee_id);

-- ─── PAYMENTS (history per invoice) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID         NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount          BIGINT       NOT NULL CHECK (amount > 0),
    method          VARCHAR(20)  NOT NULL CHECK (method IN ('cash','bkash')),
    payment_date    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    date_only       DATE         NOT NULL,
    recorded_by     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    recorded_by_name VARCHAR(120) NOT NULL,
    receipt_no      VARCHAR(40)  UNIQUE NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date_only  ON payments(date_only DESC);

-- ─── INVOICE AMENDMENTS (audit trail for fee revisions, director-only) ─
CREATE TABLE IF NOT EXISTS invoice_amendments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID         NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    previous_amount BIGINT       NOT NULL CHECK (previous_amount >= 0),
    new_amount      BIGINT       NOT NULL CHECK (new_amount >= 0),
    delta           BIGINT       NOT NULL,                            -- new_amount - previous_amount (positive = up, negative = down)
    reason          TEXT         NOT NULL,
    amended_by      INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    amended_by_name VARCHAR(120) NOT NULL,
    amended_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_amendments_invoice_id ON invoice_amendments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_amendments_amended_at ON invoice_amendments(amended_at DESC);

-- ─── Updated-at trigger helper ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
