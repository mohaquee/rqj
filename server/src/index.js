import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pool, query, withTransaction } from "./db.js";
import { requireAuth, requireDirector, signToken } from "./auth.js";

dotenv.config();

const app = express();

// ─── Middleware ────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Allow same-origin / curl
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("CORS: origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

// Request logger (production-grade simple)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ═══════════════════════════════════════════════════════════════
//  HEALTH
// ═══════════════════════════════════════════════════════════════
app.get("/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok", db: "connected", time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected", message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const result = await query(
      `SELECT id, username, password_hash, employee_id, role, display_name, display_role, is_active
       FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username.trim()]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: "Account is disabled. Contact your administrator." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    await query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);

    const token = signToken({
      userId: user.id,
      employeeId: user.employee_id,
      role: user.role,
      displayName: user.display_name,
      displayRole: user.display_role,
      username: user.username,
    });

    res.json({
      token,
      user: {
        username: user.username,
        employeeId: user.employee_id,
        role: user.role,
        displayName: user.display_name,
        displayRole: user.display_role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  res.json({
    username: req.user.username,
    employeeId: req.user.employeeId,
    role: req.user.role,
    displayName: req.user.displayName,
    displayRole: req.user.displayRole,
  });
});

// ═══════════════════════════════════════════════════════════════
//  EMPLOYEES (read-only — managed via DB)
// ═══════════════════════════════════════════════════════════════
app.get("/api/employees", requireAuth, async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, name, short_name AS "shortName", role, tier, category, avatar
       FROM employees ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Employees error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  CLIENTS
// ═══════════════════════════════════════════════════════════════
app.get("/api/clients", requireAuth, async (_req, res) => {
  try {
    const result = await query(
      `SELECT
          c.id, c.name, c.address, c.contact, c.email, c.phone,
          COALESCE(SUM(CASE WHEN i.status != 'paid' THEN i.outstanding ELSE 0 END), 0)::bigint AS outstanding
       FROM clients c
       LEFT JOIN invoices i ON i.client_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );
    res.json(result.rows.map(r => ({
      ...r,
      outstanding: Number(r.outstanding),
    })));
  } catch (err) {
    console.error("Clients GET error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/clients", requireAuth, async (req, res) => {
  const { name, address, contact, email, phone } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: "Client name is required" });
  if (!address?.trim()) return res.status(400).json({ error: "Address is required" });
  if (!contact?.trim()) return res.status(400).json({ error: "Contact person is required" });
  if (!phone?.trim()) return res.status(400).json({ error: "Mobile number is required" });

  try {
    const result = await query(
      `INSERT INTO clients (name, address, contact, email, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, address, contact, email, phone`,
      [name.trim(), address.trim(), contact.trim(), email?.trim() || "", phone.trim()]
    );
    res.status(201).json({ ...result.rows[0], outstanding: 0 });
  } catch (err) {
    console.error("Clients POST error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/clients/:id", requireAuth, requireDirector, async (req, res) => {
  const { id } = req.params;
  const { name, address, contact, email, phone } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: "Client name is required" });
  if (!address?.trim()) return res.status(400).json({ error: "Address is required" });
  if (!contact?.trim()) return res.status(400).json({ error: "Contact person is required" });
  if (!phone?.trim()) return res.status(400).json({ error: "Mobile number is required" });

  try {
    const result = await withTransaction(async (client) => {
      const upd = await client.query(
        `UPDATE clients
         SET name = $1, address = $2, contact = $3, email = $4, phone = $5
         WHERE id = $6
         RETURNING id, name, address, contact, email, phone`,
        [name.trim(), address.trim(), contact.trim(), email?.trim() || "", phone.trim(), id]
      );
      if (upd.rowCount === 0) return null;
      // Sync denormalized client_name on invoices
      await client.query(`UPDATE invoices SET client_name = $1 WHERE client_id = $2`, [name.trim(), id]);
      return upd.rows[0];
    });
    if (!result) return res.status(404).json({ error: "Client not found" });
    res.json({ ...result, outstanding: 0 });
  } catch (err) {
    console.error("Clients PUT error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  INVOICES
// ═══════════════════════════════════════════════════════════════

// Compute status from issue date age + payment state
function computeStatus(issueDate, paid, amount) {
  if (paid >= amount) return "paid";
  const ageMs = Date.now() - new Date(issueDate).getTime();
  const days = ageMs / (1000 * 60 * 60 * 24);
  if (days < 14) return "sent";
  if (days < 60) return "outstanding";
  return "overdue";
}

// Generate invoice number INV-YYMM-XXX-NNN
async function nextInvoiceNo(client) {
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = now.getMonth();
  const year = now.getFullYear();
  const countResult = await client.query(
    `SELECT COUNT(*)::int AS c FROM invoices WHERE month = $1 AND year = $2`,
    [month, year]
  );
  const seq = String(countResult.rows[0].c + 1).padStart(3, "0");
  const random = String(Math.floor(Math.random() * 900) + 100);
  return `INV-${yymm}-${seq}-${random}`;
}

// Helper: load full invoice with items + payments for response
async function loadInvoice(client, invoiceId) {
  const inv = await client.query(
    `SELECT id, invoice_no AS "invoiceNo", client_id AS "clientId", client_name AS "clientName",
            issue_date::text AS "issueDate", amount, paid, outstanding, status, month, year
     FROM invoices WHERE id = $1`,
    [invoiceId]
  );
  if (inv.rowCount === 0) return null;

  const items = await client.query(
    `SELECT id, description, employee_id AS "employeeId", amount
     FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order, id`,
    [invoiceId]
  );

  const payments = await client.query(
    `SELECT id, amount, method,
            payment_date AS date,
            date_only::text AS "dateOnly",
            recorded_by_name AS "recordedBy",
            receipt_no AS "receiptNo"
     FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC`,
    [invoiceId]
  );

  const amendments = await client.query(
    `SELECT id, previous_amount AS "previousAmount", new_amount AS "newAmount",
            delta, reason, amended_by_name AS "amendedByName",
            amended_at AS "amendedAt"
     FROM invoice_amendments WHERE invoice_id = $1 ORDER BY amended_at DESC`,
    [invoiceId]
  );

  return {
    ...inv.rows[0],
    amount: Number(inv.rows[0].amount),
    paid: Number(inv.rows[0].paid),
    outstanding: Number(inv.rows[0].outstanding),
    items: items.rows.map(r => ({ ...r, amount: Number(r.amount) })),
    payments: payments.rows.map(r => ({ ...r, amount: Number(r.amount) })),
    amendments: amendments.rows.map(r => ({
      ...r,
      previousAmount: Number(r.previousAmount),
      newAmount: Number(r.newAmount),
      delta: Number(r.delta),
    })),
  };
}

/**
 * GET /api/invoices
 *   - Director sees all
 *   - Employees see only invoices where any item is theirs
 */
app.get("/api/invoices", requireAuth, async (req, res) => {
  try {
    const isDirector = req.user.role === "director";
    const empId = req.user.employeeId;

    // Recompute statuses on the fly (cheaper than a cron job)
    await query(`
      UPDATE invoices
      SET status = CASE
        WHEN paid >= amount THEN 'paid'
        WHEN (NOW()::date - issue_date) < 14 THEN 'sent'
        WHEN (NOW()::date - issue_date) < 60 THEN 'outstanding'
        ELSE 'overdue'
      END
      WHERE NOT (
        status = (CASE
          WHEN paid >= amount THEN 'paid'
          WHEN (NOW()::date - issue_date) < 14 THEN 'sent'
          WHEN (NOW()::date - issue_date) < 60 THEN 'outstanding'
          ELSE 'overdue'
        END)
      )
    `);

    const sql = isDirector
      ? `SELECT i.id, i.invoice_no AS "invoiceNo", i.client_id AS "clientId", i.client_name AS "clientName",
                i.issue_date::text AS "issueDate", i.amount, i.paid, i.outstanding, i.status, i.month, i.year
         FROM invoices i ORDER BY i.issue_date DESC, i.created_at DESC`
      : `SELECT i.id, i.invoice_no AS "invoiceNo", i.client_id AS "clientId", i.client_name AS "clientName",
                i.issue_date::text AS "issueDate", i.amount, i.paid, i.outstanding, i.status, i.month, i.year
         FROM invoices i
         WHERE EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id AND ii.employee_id = $1)
         ORDER BY i.issue_date DESC, i.created_at DESC`;

    const params = isDirector ? [] : [empId];
    const invoicesResult = await query(sql, params);
    const invoiceIds = invoicesResult.rows.map(r => r.id);

    if (invoiceIds.length === 0) return res.json([]);

    // Bulk-load items, payments, and amendments
    const itemsResult = await query(
      `SELECT id, invoice_id, description, employee_id AS "employeeId", amount
       FROM invoice_items WHERE invoice_id = ANY($1::uuid[])
       ORDER BY sort_order, id`,
      [invoiceIds]
    );
    const paymentsResult = await query(
      `SELECT id, invoice_id, amount, method,
              payment_date AS date, date_only::text AS "dateOnly",
              recorded_by_name AS "recordedBy", receipt_no AS "receiptNo"
       FROM payments WHERE invoice_id = ANY($1::uuid[])
       ORDER BY payment_date DESC`,
      [invoiceIds]
    );
    const amendmentsResult = await query(
      `SELECT id, invoice_id, previous_amount AS "previousAmount", new_amount AS "newAmount",
              delta, reason, amended_by_name AS "amendedByName", amended_at AS "amendedAt"
       FROM invoice_amendments WHERE invoice_id = ANY($1::uuid[])
       ORDER BY amended_at DESC`,
      [invoiceIds]
    );

    const itemsByInv = new Map();
    for (const r of itemsResult.rows) {
      const arr = itemsByInv.get(r.invoice_id) || [];
      arr.push({ id: r.id, description: r.description, employeeId: r.employeeId, amount: Number(r.amount) });
      itemsByInv.set(r.invoice_id, arr);
    }
    const paymentsByInv = new Map();
    for (const r of paymentsResult.rows) {
      const arr = paymentsByInv.get(r.invoice_id) || [];
      arr.push({
        id: r.id, amount: Number(r.amount), method: r.method,
        date: r.date, dateOnly: r.dateOnly,
        recordedBy: r.recordedBy, receiptNo: r.receiptNo,
      });
      paymentsByInv.set(r.invoice_id, arr);
    }
    const amendmentsByInv = new Map();
    for (const r of amendmentsResult.rows) {
      const arr = amendmentsByInv.get(r.invoice_id) || [];
      arr.push({
        id: r.id,
        previousAmount: Number(r.previousAmount),
        newAmount: Number(r.newAmount),
        delta: Number(r.delta),
        reason: r.reason,
        amendedByName: r.amendedByName,
        amendedAt: r.amendedAt,
      });
      amendmentsByInv.set(r.invoice_id, arr);
    }

    const result = invoicesResult.rows.map(inv => ({
      ...inv,
      amount: Number(inv.amount),
      paid: Number(inv.paid),
      outstanding: Number(inv.outstanding),
      items: itemsByInv.get(inv.id) || [],
      payments: paymentsByInv.get(inv.id) || [],
      amendments: amendmentsByInv.get(inv.id) || [],
    }));
    res.json(result);
  } catch (err) {
    console.error("Invoices GET error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/invoices
 * Director: can create invoices with any employeeId on line items.
 * Employee: can create invoices, but every line item's employeeId must match their own
 *           (they cannot assign work to other employees).
 * Body: { clientId, issueDate, items: [{description, employeeId, amount}] }
 */
app.post("/api/invoices", requireAuth, async (req, res) => {
  const { clientId, issueDate, items } = req.body || {};
  if (!clientId) return res.status(400).json({ error: "Client is required" });
  if (!issueDate) return res.status(400).json({ error: "Issue date is required" });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "At least one line item is required" });

  for (const it of items) {
    if (!it.description?.trim()) return res.status(400).json({ error: "All items need a description" });
    if (!Number.isFinite(Number(it.amount)) || Number(it.amount) <= 0) return res.status(400).json({ error: "All items need a positive amount" });
  }

  // Employees can only create invoices where every item is assigned to themselves
  if (req.user.role !== "director") {
    const ownEmpId = req.user.employeeId;
    for (const it of items) {
      if (it.employeeId && it.employeeId !== ownEmpId) {
        return res.status(403).json({ error: "Employees can only assign line items to themselves" });
      }
    }
  }

  try {
    const result = await withTransaction(async (client) => {
      // Look up client name
      const cl = await client.query(`SELECT name FROM clients WHERE id = $1`, [clientId]);
      if (cl.rowCount === 0) throw new Error("Client not found");
      const clientName = cl.rows[0].name;

      const totalAmount = items.reduce((s, it) => s + Math.round(Number(it.amount)), 0);
      const issueDt = new Date(issueDate);
      const status = computeStatus(issueDate, 0, totalAmount);
      const invoiceNo = await nextInvoiceNo(client);

      const inv = await client.query(
        `INSERT INTO invoices (invoice_no, client_id, client_name, issue_date, amount, paid, outstanding, status, month, year, created_by)
         VALUES ($1, $2, $3, $4, $5, 0, $5, $6, $7, $8, $9)
         RETURNING id`,
        [invoiceNo, clientId, clientName, issueDate, totalAmount, status, issueDt.getMonth(), issueDt.getFullYear(), req.user.userId]
      );
      const invoiceId = inv.rows[0].id;

      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        await client.query(
          `INSERT INTO invoice_items (invoice_id, description, employee_id, amount, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [invoiceId, it.description.trim(), it.employeeId || null, Math.round(Number(it.amount)), idx]
        );
      }

      return loadInvoice(client, invoiceId);
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Invoices POST error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/**
 * POST /api/invoices/:id/payments
 * Records a payment. Either director or any logged-in user can record one
 * (employees can record their own clients' cash payments).
 * Body: { amount, method }
 */
app.post("/api/invoices/:id/payments", requireAuth, async (req, res) => {
  const { id: invoiceId } = req.params;
  const { amount, method } = req.body || {};
  const amt = Math.round(Number(amount));

  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: "Amount must be positive" });
  if (!["cash", "bkash"].includes(method)) return res.status(400).json({ error: "Method must be 'cash' or 'bkash'" });

  try {
    const result = await withTransaction(async (client) => {
      const inv = await client.query(
        `SELECT id, amount, paid, outstanding, status, issue_date FROM invoices WHERE id = $1 FOR UPDATE`,
        [invoiceId]
      );
      if (inv.rowCount === 0) throw { status: 404, message: "Invoice not found" };

      const row = inv.rows[0];
      const currentOutstanding = Number(row.outstanding);
      if (amt > currentOutstanding) throw { status: 400, message: `Payment exceeds outstanding (৳${currentOutstanding})` };

      // If employee, verify they handled at least one item on this invoice
      if (req.user.role !== "director") {
        const handled = await client.query(
          `SELECT 1 FROM invoice_items WHERE invoice_id = $1 AND employee_id = $2 LIMIT 1`,
          [invoiceId, req.user.employeeId]
        );
        if (handled.rowCount === 0) throw { status: 403, message: "You can only record payments for your own invoices" };
      }

      const newPaid = Number(row.paid) + amt;
      const newOutstanding = Number(row.amount) - newPaid;
      const newStatus = computeStatus(row.issue_date, newPaid, Number(row.amount));

      const receiptNo = `RCP-${Date.now().toString().slice(-8)}`;

      await client.query(
        `INSERT INTO payments (invoice_id, amount, method, date_only, recorded_by, recorded_by_name, receipt_no)
         VALUES ($1, $2, $3, NOW()::date, $4, $5, $6)`,
        [invoiceId, amt, method, req.user.userId, req.user.displayName, receiptNo]
      );

      await client.query(
        `UPDATE invoices SET paid = $1, outstanding = $2, status = $3 WHERE id = $4`,
        [newPaid, newOutstanding, newStatus, invoiceId]
      );

      const fullInvoice = await loadInvoice(client, invoiceId);
      return {
        receipt: {
          receiptNo,
          invoiceNo: fullInvoice.invoiceNo,
          clientName: fullInvoice.clientName,
          receivedBy: req.user.displayName,
          receivedByRole: req.user.displayRole,
          method,
          date: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          amountBefore: currentOutstanding,
          paymentAmount: amt,
          remainingOutstanding: newOutstanding,
          invoiceTotal: Number(row.amount),
          totalPaidAfter: newPaid,
        },
        invoice: fullInvoice,
      };
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Payment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/invoices/:id/amendments
 * Director-only. Revises an invoice amount up or down, with a mandatory reason.
 * Recomputes outstanding and status. Logged as an append-only amendment record.
 * Body: { newAmount, reason }
 */
app.post("/api/invoices/:id/amendments", requireAuth, requireDirector, async (req, res) => {
  const { id: invoiceId } = req.params;
  const { newAmount, reason } = req.body || {};
  const newAmt = Math.round(Number(newAmount));

  if (!Number.isFinite(newAmt) || newAmt < 0) {
    return res.status(400).json({ error: "New amount must be a non-negative number" });
  }
  if (!reason || typeof reason !== "string" || !reason.trim()) {
    return res.status(400).json({ error: "Reason is required for amendments (audit trail)" });
  }
  if (reason.trim().length < 3) {
    return res.status(400).json({ error: "Reason must be at least 3 characters" });
  }

  try {
    const result = await withTransaction(async (client) => {
      // Lock the invoice row to prevent concurrent amendments
      const inv = await client.query(
        `SELECT id, amount, paid, outstanding, status, issue_date FROM invoices WHERE id = $1 FOR UPDATE`,
        [invoiceId]
      );
      if (inv.rowCount === 0) throw { status: 404, message: "Invoice not found" };

      const row = inv.rows[0];
      const previousAmount = Number(row.amount);
      const paid = Number(row.paid);

      if (newAmt === previousAmount) {
        throw { status: 400, message: "New amount is the same as the current amount — nothing to amend" };
      }
      if (newAmt < paid) {
        throw { status: 400, message: `New amount (৳${newAmt}) cannot be less than amount already paid (৳${paid})` };
      }

      const newOutstanding = newAmt - paid;
      const delta = newAmt - previousAmount;

      // Recompute status with the new amount
      const ageMs = Date.now() - new Date(row.issue_date).getTime();
      const days = ageMs / (1000 * 60 * 60 * 24);
      let newStatus;
      if (paid >= newAmt) newStatus = "paid";
      else if (days < 14) newStatus = "sent";
      else if (days < 60) newStatus = "outstanding";
      else newStatus = "overdue";

      // Insert amendment record (append-only audit trail)
      await client.query(
        `INSERT INTO invoice_amendments (invoice_id, previous_amount, new_amount, delta, reason, amended_by, amended_by_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [invoiceId, previousAmount, newAmt, delta, reason.trim(), req.user.userId, req.user.displayName]
      );

      // Update the invoice
      await client.query(
        `UPDATE invoices SET amount = $1, outstanding = $2, status = $3 WHERE id = $4`,
        [newAmt, newOutstanding, newStatus, invoiceId]
      );

      return loadInvoice(client, invoiceId);
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Amendment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  ERROR HANDLER (must be last)
// ═══════════════════════════════════════════════════════════════
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

const PORT = parseInt(process.env.PORT || "4000", 10);
app.listen(PORT, () => {
  console.log(`✅ RQJ API listening on port ${PORT}`);
  console.log(`   CORS allowed origins: ${allowedOrigins.join(", ")}`);
});
