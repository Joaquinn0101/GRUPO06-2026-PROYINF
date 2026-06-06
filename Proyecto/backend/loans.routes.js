// backend/loans.routes.js
const express = require("express");
const { z } = require("zod");
const pool = require("./db");

// Lógica de negocio
const { calcularScoring, calcularProbabilidad, obtenerRecomendacion } = require("./scoring");
const { validarRut, validarTelefonoChileno } = require("./validaciones");
const logger = require("./logger");
// IMPORTAR LÓGICA DE SEGURIDAD (auth.js)
const { hashPassword, comparePassword, generateToken, authenticateToken } = require("./auth");

const router = express.Router();

/* =============== Utilidades locales =============== */
function normalizarTelefonoCL(input = "") {
    if (!input) return "";
    const raw = String(input).trim().replace(/\s+/g, "");
    let digits = raw.replace(/^\+/, "");
    if (digits.startsWith("569")) {
        // ok
    } else if (digits.startsWith("9")) {
        digits = "569" + digits;
    }
    if (!/^\d+$/.test(digits)) return input;
    const rest = digits.slice(3);
    if (!digits.startsWith("569") || rest.length !== 8) return input;
    return `+569${rest}`; // canónico sin espacio
}

const normalizeRut = (rut = "") => {
    if (!rut || typeof rut !== "string") return "";
    return rut.replace(/[\.\-\s]/g, "").toUpperCase();
};

/* =============== Esquemas de validación request =============== */
// Esquemas NUEVOS para Registro/Login
const RegisterSchema = z.object({
    rut: z
        .string()
        .min(3)
        .transform(normalizeRut)
        .refine((v) => validarRut(v), { message: "RUT inválido" }),
    full_name: z.string().min(3, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La clave debe tener al menos 6 caracteres."),
});

const LoginSchema = z.object({
    rut: z
        .string()
        .min(3, "RUT requerido")
        .transform(normalizeRut),
    password: z.string().min(1, "Clave requerida"),
});

// Esquema de Aplicación de Préstamo (Existente)
const ApplySchema = z.object({
    rut: z.string().min(3).refine((v) => validarRut(v), { message: "RUT inválido" }),
    full_name: z.string().min(3, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    phone: z
        .string()
        .optional()
        .transform((v) => (v ? normalizarTelefonoCL(v) : v))
        .refine((v) => (v ? validarTelefonoChileno(v) : true), {
            message: "Teléfono inválido. Usa +569 12345678",
        }),
    amount: z.number().int().positive("Monto > 0"),
    term_months: z.number().int().positive("Plazo > 0"),
    income: z.number().int().nonnegative().optional(),
    seniority: z.number().int().nonnegative().optional(),
    existing_debt: z.number().int().nonnegative().optional(),
});

/* =============== DDL: asegurar tablas =============== */
async function ensureTables() {
    // 1. Tabla USERS
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            rut VARCHAR(12) UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'client',
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_users_rut ON users(rut);
    `);

    // 🔹 ASEGURAR COLUMNA ROLE SI LA TABLA YA EXISTÍA
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';`);

    // 2. Tabla loan_requests (Préstamos)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS loan_requests (
            id SERIAL PRIMARY KEY,
            rut TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            amount INTEGER NOT NULL,
            term_months INTEGER NOT NULL,
            income INTEGER,
            status TEXT NOT NULL DEFAULT 'pendiente',
            scoring INTEGER,
            decided_by INTEGER REFERENCES users(user_id),
            doc_salary_slip TEXT,
            doc_address_proof TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    // 3. Tabla loan_drafts (HU #1: Guardado temporal)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS loan_drafts (
            id SERIAL PRIMARY KEY,
            rut TEXT NOT NULL,
            draft_data JSONB NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_loan_drafts_rut ON loan_drafts(rut);
    `);

    // Columnas adicionales para loan_requests si no existen
    await pool.query(`ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS phone TEXT;`);
    await pool.query(`ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS seniority INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS existing_debt INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS remaining_balance INTEGER;`);
    await pool.query(`ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS decided_by INTEGER REFERENCES users(user_id);`);
    await pool.query(`ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS doc_salary_slip TEXT;`);
    await pool.query(`ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS doc_address_proof TEXT;`);

    // 🔹 Tabla de pagos
    await pool.query(`
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            loan_id INTEGER NOT NULL REFERENCES loan_requests(id) ON DELETE CASCADE,
            amount INTEGER NOT NULL,
            method TEXT,
            paid_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    // 🔹 Inicializar remaining_balance en préstamos antiguos
    await pool.query(`
        UPDATE loan_requests
        SET remaining_balance = amount
        WHERE remaining_balance IS NULL;
    `);

    // Constraint teléfono
    try {
        await pool.query(`
            ALTER TABLE loan_requests
                ADD CONSTRAINT chk_phone_cl
                    CHECK (phone IS NULL OR phone ~ '^\\+?569 ?[0-9]{8}$');
        `);
    } catch (_) {
        // ya existe
    }
}

/* =============== MIDDLEWARE DE AUTORIZACIÓN =============== */
function authorizeRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: "Acceso denegado. Se requiere rol: " + role });
        }
        next();
    };
}

/* =============== RUTAS DE AUTENTICACIÓN (HU 5) =============== */

// POST /loans/register
router.post("/register", async (req, res) => {
    try {
        await ensureTables();
        const RegisterSchema = z.object({
            rut: z.string().min(3).transform(normalizeRut).refine((v) => validarRut(v), { message: "RUT inválido" }),
            full_name: z.string().min(3, "Nombre requerido"),
            email: z.string().email("Email inválido"),
            password: z.string().min(6, "La clave debe tener al menos 6 caracteres."),
            role: z.enum(["client", "executive"]).optional().default("client"),
        });

        const parsed = RegisterSchema.parse(req.body);
        const { rut, email, password, full_name, role } = parsed;

        const passwordHash = await hashPassword(password);

        const { rows } = await pool.query(
            `INSERT INTO users (rut, email, password_hash, full_name, role)
             VALUES ($1, $2, $3, $4, $5)
                 RETURNING user_id, rut, full_name, email, role`,
            [rut, email, passwordHash, full_name, role]
        );

        const user = rows[0];
        // IMPORTANTE: Incluir el rol en el token
        const token = generateToken(user.user_id, user.rut, user.role);

        res.status(201).json({
            token,
            user_id: user.user_id,
            full_name: user.full_name,
            rut: user.rut,
            role: user.role,
            message: "Registro exitoso.",
        });
    } catch (e) {
        if (e.code === "23505") {
            return res.status(409).json({ error: "El RUT o Email ya se encuentra registrado." });
        }
        if (e.issues) {
            const firstError = e.issues[0]?.message || "Datos inválidos.";
            return res.status(400).json({ error: firstError });
        }
        console.error(e);
        res.status(500).json({ error: "registration_failed" });
    }
});

// POST /loans/login
router.post("/login", async (req, res) => {
    try {
        const parsed = LoginSchema.parse(req.body);
        const { rut, password } = parsed;

        const { rows } = await pool.query(`SELECT * FROM users WHERE rut = $1`, [rut]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ error: "RUT o clave inválida." });
        }

        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "RUT o clave inválida." });
        }

        // IMPORTANTE: Incluir el rol en el token
        const token = jwt.sign({ user_id: user.user_id, rut: user.rut, role: user.role }, "TU_CLAVE_SUPER_SECRETA_Y_LARGA", { expiresIn: '24h' });

        res.json({
            token,
            user_id: user.user_id,
            full_name: user.full_name,
            rut: user.rut,
            role: user.role
        });
    } catch (e) {
        if (e.issues) {
            const firstError = e.issues[0]?.message || "Datos inválidos.";
            return res.status(400).json({ error: firstError });
        }
        console.error("Error en POST /login:", e);
        res.status(500).json({ error: "login_failed" });
    }
});

/* =============== Rutas bajo /loans =============== */

// Salud del router
router.get("/health", (_req, res) => res.json({ ok: true, scope: "loans" }));

// POST /loans/apply → inserta, calcula scoring y devuelve {id,status,scoring}
router.post("/apply", authenticateToken, async (req, res) => {
    try {
        await ensureTables();

        const parsed = ApplySchema.parse({
            rut: req.body?.rut,
            full_name: req.body?.full_name,
            email: req.body?.email,
            phone: req.body?.phone,
            amount: Number(req.body?.amount),
            term_months: Number(req.body?.term_months),
            income: req.body?.income == null ? undefined : Number(req.body?.income),
            seniority: req.body?.seniority == null ? undefined : Number(req.body?.seniority),
            existing_debt: req.body?.existing_debt == null ? undefined : Number(req.body?.existing_debt),
        });

        const { rut, full_name, email, phone, amount, term_months, income, seniority, existing_debt } = parsed;

        // HU #8: Validación estricta - El usuario solo puede solicitar para sí mismo
        if (req.user.role === 'client' && normalizeRut(req.user.rut) !== normalizeRut(rut)) {
            logger.warn("Intento de solicitud para otro RUT", { user: req.user.rut, target: rut });
            return res.status(403).json({ error: "No tienes permiso para realizar una solicitud para este RUT." });
        }

        // Insertar como pendiente (incluyendo remaining_balance)
        const insertQ = `
            INSERT INTO loan_requests
            (rut, full_name, email, phone, amount, term_months, income, seniority, existing_debt, status, remaining_balance)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pendiente',$5)
                RETURNING *;
        `;
        const { rows: insertedRows } = await pool.query(insertQ, [
            rut,
            full_name,
            email,
            phone ?? null,
            amount,
            term_months,
            income ?? null,
            seniority ?? 0,
            existing_debt ?? 0,
        ]);
        const reqRow = insertedRows[0];

        const ingreso = income ?? 0;
        const score = calcularScoring(ingreso, amount, term_months, seniority ?? 0, existing_debt ?? 0);

        const finalStatus = score >= 60 ? "aprobada" : "rechazada";

        const updateQ = `
            UPDATE loan_requests
            SET status = $2, scoring = $3
            WHERE id = $1
            RETURNING id, status, scoring;
        `;
        const { rows: updatedRows } = await pool.query(updateQ, [reqRow.id, finalStatus, score]);

        logger.info("Solicitud procesada con éxito", { id: updatedRows[0].id, status: finalStatus, score });

        // HU #1: Limpiar draft si existe
        await pool.query(`DELETE FROM loan_drafts WHERE rut = $1`, [normalizeRut(rut)]);

        return res.status(201).json({
            id: updatedRows[0].id,
            status: updatedRows[0].status,
            scoring: updatedRows[0].scoring,
        });
    } catch (err) {
        if (err?.issues) {
            return res.status(400).json({ error: "validation_error", issues: err.issues });
        }
        logger.error("Error en POST /apply", { error: err.message });
        return res.status(500).json({ error: "apply_failed" });
    }
});

/* =============== RUTAS DE DRAFTS (HU #1) =============== */

// POST /loans/draft → Guardado temporal del estado de la solicitud
router.post("/draft", authenticateToken, async (req, res) => {
    try {
        await ensureTables();
        const { rut } = req.user;
        const draftData = req.body;

        const { rows } = await pool.query(
            `INSERT INTO loan_drafts (rut, draft_data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (rut) DO UPDATE SET draft_data = $2, updated_at = NOW()
             RETURNING *`,
            [normalizeRut(rut), draftData]
        );

        logger.info("Draft guardado", { rut });
        res.json({ message: "Progreso guardado temporalmente.", draft: rows[0] });
    } catch (e) {
        logger.error("Error al guardar draft", { error: e.message });
        res.status(500).json({ error: "draft_save_failed" });
    }
});

// GET /loans/draft → Recuperar estado temporal
router.get("/draft", authenticateToken, async (req, res) => {
    try {
        await ensureTables();
        const { rut } = req.user;
        const { rows } = await pool.query(
            `SELECT * FROM loan_drafts WHERE rut = $1`,
            [normalizeRut(rut)]
        );

        if (!rows.length) return res.status(404).json({ error: "No hay drafts guardados." });
        res.json(rows[0]);
    } catch (e) {
        logger.error("Error al recuperar draft", { error: e.message });
        res.status(500).json({ error: "draft_fetch_failed" });
    }
});

// GET /loans/:id/status → consulta rápida para polling si lo usas
router.get("/:id/status", async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, status, scoring FROM loan_requests WHERE id = $1`,
            [Number(req.params.id)]
        );
        if (!rows.length) return res.status(404).json({ error: "not_found" });
        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "internal_error" });
    }
});

// --- RUTA PROTEGIDA: GET /loans/dashboard ---
router.get("/dashboard", authenticateToken, async (req, res) => {
    try {
        await ensureTables();

        const { rut } = req.user;

        const { rows: loanRequests } = await pool.query(
            `SELECT id, amount, term_months, status, created_at, scoring, remaining_balance
             FROM loan_requests
             WHERE rut = $1
             ORDER BY created_at DESC`,
            [rut]
        );

        const pendingPayments = loanRequests
            .filter((r) => r.status === "aprobada" && r.remaining_balance > 0)
            .map((r) => ({
                loan_id: r.id,
                amount: Math.round(r.amount / r.term_months),
                due_date: new Date(
                    new Date().setMonth(new Date().getMonth() + 1)
                )
                    .toISOString()
                    .split("T")[0],
            }));

        res.json({
            rut,
            latest_status: loanRequests[0]?.status || "No hay solicitudes",
            loan_requests: loanRequests,
            pending_payments: pendingPayments,
            message: "Acceso autorizado al dashboard.",
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "dashboard_failed" });
    }
});

// 🔹 GET /loans/:id → detalle de un préstamo (para el portal de pagos)
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        await ensureTables();

        const loanId = Number(req.params.id);

        if (Number.isNaN(loanId)) {
            return res.status(400).json({ error: "id_invalido" });
        }

        // 🔥 HU #8: Validación de propiedad
        const { rows } = await pool.query(
            `SELECT id, rut, full_name, amount, term_months, status, scoring, created_at, remaining_balance
             FROM loan_requests
             WHERE id = $1`,
            [loanId]
        );

        if (!rows.length) {
            return res.status(404).json({ error: "not_found" });
        }

        const loan = rows[0];
        // Si es cliente, solo puede ver el suyo. Si es ejecutivo, puede ver cualquiera.
        if (req.user.role === 'client' && normalizeRut(req.user.rut) !== normalizeRut(loan.rut)) {
            logger.warn("Acceso denegado a préstamo ajeno", { user: req.user.rut, loanId });
            return res.status(403).json({ error: "No tienes permiso para ver este préstamo." });
        }

        return res.json(loan);
    } catch (e) {
        logger.error("Error en GET /loans/:id", { error: e.message });
        return res.status(500).json({ error: "internal_error" });
    }
});


// 🔹 POST /loans/:id/payments → registrar un pago (simulado)
router.post("/:id/payments", authenticateToken, async (req, res) => {
    try {
        await ensureTables();

        const loanId = Number(req.params.id);
        const { amount, method } = req.body;

        if (Number.isNaN(loanId)) {
            return res.status(400).json({ message: "ID de préstamo inválido." });
        }

        const pago = Number(amount);
        if (!pago || pago <= 0) {
            return res.status(400).json({ message: "Monto inválido." });
        }

        const { rows: loanRows } = await pool.query(
            `SELECT id, rut, amount, term_months, status, remaining_balance
             FROM loan_requests
             WHERE id = $1`,
            [loanId]
        );

        const loan = loanRows[0];
        if (!loan) {
            return res.status(404).json({ message: "Crédito no encontrado." });
        }

        // 🔥 HU #8: Validación de propiedad para pagos
        if (req.user.role === 'client' && normalizeRut(req.user.rut) !== normalizeRut(loan.rut)) {
            logger.warn("Intento de pago en préstamo ajeno", { user: req.user.rut, loanId });
            return res.status(403).json({ message: "No puedes pagar un préstamo que no te pertenece." });
        }

        if (loan.remaining_balance <= 0) {
            return res.status(400).json({ message: "El crédito ya está pagado." });
        }

        const { rows: paymentRows } = await pool.query(
            `INSERT INTO payments (loan_id, amount, method)
             VALUES ($1, $2, $3)
                 RETURNING id, loan_id, amount, method, paid_at`,
            [loan.id, pago, method || null]
        );

        const newBalance = Math.max(loan.remaining_balance - pago, 0);

        const { rows: updatedLoanRows } = await pool.query(
            `UPDATE loan_requests
             SET remaining_balance = $1
             WHERE id = $2
                 RETURNING id, rut, full_name, amount, term_months, status, scoring, created_at, remaining_balance`,
            [newBalance, loan.id]
        );

        logger.info("Pago registrado", { loanId, amount: pago });

        return res.status(201).json({
            message: "Pago registrado correctamente (simulado).",
            loan: updatedLoanRows[0],
            payment: paymentRows[0],
        });
    } catch (e) {
        logger.error("Error en POST /loans/:id/payments", { error: e.message });
        return res.status(500).json({ message: "Error procesando pago." });
    }
});

router.patch("/:id/sign", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { rut } = req.user; // Obtenemos el RUT del token para seguridad

        // Solo actualizamos si el préstamo pertenece al usuario y está 'aprobada'
        const { rows } = await pool.query(
            `UPDATE loan_requests 
             SET status = 'cursada' 
             WHERE id = $1 AND rut = $2 AND status = 'aprobada'
             RETURNING *`,
            [id, rut]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Préstamo no encontrado o no apto para firma." });
        }

        res.json({ message: "Contrato firmado exitosamente.", loan: rows[0] });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error al firmar contrato." });
    }
});


// POST /loans/recommend → Sugiere monto y plazo óptimo
router.post("/recommend", async (req, res) => {
    try {
        const { income, seniority, existing_debt } = req.body;
        const recomendacion = obtenerRecomendacion(
            Number(income || 0),
            Number(seniority || 0),
            Number(existing_debt || 0)
        );
        res.json(recomendacion);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "recommend_failed" });
    }
});

// POST /loans/simulate → Recalcula probabilidad dinámicamente
router.post("/simulate", async (req, res) => {
    try {
        const { income, amount, term, seniority, existing_debt } = req.body;
        const score = calcularScoring(
            Number(income || 0),
            Number(amount || 0),
            Number(term || 0),
            Number(seniority || 0),
            Number(existing_debt || 0)
        );
        const probabilidad = calcularProbabilidad(score);
        res.json({ score, probabilidad });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "simulate_failed" });
    }
});

/* =============== RUTAS ADMINISTRATIVAS (EJECUTIVO) =============== */

// GET /loans/admin/requests → Listar todas las solicitudes (Solo Ejecutivos)
router.get("/admin/requests", authenticateToken, authorizeRole("executive"), async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, rut, full_name, amount, status, scoring, created_at 
             FROM loan_requests 
             ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "No se pudieron obtener las solicitudes." });
    }
});

// GET /loans/admin/requests/:id → Detalle de solicitud (Solo Ejecutivos)
router.get("/admin/requests/:id", authenticateToken, authorizeRole("executive"), async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(
            `SELECT * FROM loan_requests WHERE id = $1`,
            [id]
        );
        if (!rows.length) return res.status(404).json({ error: "Solicitud no encontrada." });
        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error al obtener el detalle." });
    }
});

// PATCH /loans/admin/requests/:id/evaluate → Aprobar o Rechazar (Solo Ejecutivos)
router.patch("/admin/requests/:id/evaluate", authenticateToken, authorizeRole("executive"), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'aprobada' o 'rechazada'
        const executiveId = req.user.user_id;

        if (!["aprobada", "rechazada"].includes(status)) {
            return res.status(400).json({ error: "Estado inválido. Debe ser 'aprobada' o 'rechazada'." });
        }

        const { rows } = await pool.query(
            `UPDATE loan_requests 
             SET status = $1, decided_by = $2 
             WHERE id = $3 
             RETURNING *`,
            [status, executiveId, id]
        );

        if (!rows.length) return res.status(404).json({ error: "Solicitud no encontrada." });

        res.json({ message: `Solicitud ${status} correctamente.`, loan: rows[0] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error al evaluar la solicitud." });
    }
});

module.exports = router;
