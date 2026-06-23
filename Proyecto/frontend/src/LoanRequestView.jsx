import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import {
    CheckCircle2,
    Circle,
    AlertTriangle,
    ArrowRight,
    ArrowLeft,
    FileSignature,
    CalendarClock,
    UserPlus,
    LayoutDashboard,
    Sparkles,
    ShieldCheck
} from "lucide-react";

// ——— Utilidades ———
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function cleanRut(v = "") {
    return v.replace(/[.\-\s]/g, "").toUpperCase();
}
function formatRut(v = "") {
    const raw = cleanRut(v);
    if (!raw) return "";
    const cuerpo = raw.slice(0, -1).replace(/\D/g, "");
    const dv = raw.slice(-1);
    if (!cuerpo) return dv;
    const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${conPuntos}-${dv}`;
}
function validateRut(v = "") {
    const valor = cleanRut(v);
    if (!/^[0-9]+[0-9K]$/.test(valor)) return false;
    const cuerpo = valor.slice(0, -1);
    const dv = valor.slice(-1);
    let suma = 0, multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    const dvEsperado = 11 - (suma % 11);
    const dvFinal = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : String(dvEsperado);
    return dvFinal === dv;
}
function normalizePhoneCL(v = "") {
    const trimmed = v.replace(/\s+/g, "");
    let digits = trimmed.replace(/^\+/, "");
    if (digits.startsWith("569")) {
        // ok
    } else if (digits.startsWith("9")) {
        digits = "569" + digits;
    } else if (/^\d+$/.test(digits) && digits.length <= 11) {
        return v;
    }
    if (!digits.startsWith("569")) return v;
    const rest = digits.slice(3, 11);
    if (!rest) return "+569 ";
    if (rest.length > 8) return `+569 ${rest.slice(0, 8)}`;
    return `+569 ${rest}`;
}
function validatePhoneCL(v = "") {
    const s = v.trim();
    return /^\+?569\s?[0-9]{8}$/.test(s);
}

function estimateMonthlyPayment(capital, meses, tasaMensual = 0.019) {
    if (!capital || !meses) return 0;
    if (tasaMensual === 0) return Math.round(capital / meses);
    const r = tasaMensual;
    const cuota = (capital * r) / (1 - Math.pow(1 + r, -meses));
    return Math.round(cuota);
}

// ——— UI helpers ———
const Field = ({ label, required, children }) => (
    <label className="block">
    <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label} {required && <span className="text-red-600 dark:text-red-400">*</span>}
    </span>
        {children}
    </label>
);
const Card = ({ children, className = "" }) => (
    <div className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm ${className}`}>{children}</div>
);

// ——— Vista principal ———
export default function LoanRequestView() {
    const navigate = useNavigate();
    const { token, user } = useAuth(); // <--- 2. Obtenemos el estado de autenticación
    
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [createdId, setCreatedId] = useState(null);
    const [status, setStatus] = useState(null);
    const [score, setScore] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    
    // Recomendación del sistema
    const [recommendation, setRecommendation] = useState(null);
    const [simulatedProb, setSimulatedProb] = useState(null);
    const [loadingRec, setLoadingRec] = useState(false);

    // Pre-llenar datos si el usuario ya está logueado (Opcional, pero buena UX)
    const [data, setData] = useState({
        rut: user?.rut ? formatRut(user.rut) : "", // Si hay usuario, usamos su RUT
        fullName: user?.full_name || "",
        email: user?.email || "",
        phone: "",
        income: "",
        seniority: "", // <-- NUEVO
        existingDebt: "", // <-- NUEVO
        amount: "1500000",
        term: "24",
        accept: false,
    });

    const canNext1 = useMemo(() => {
        return (
            validateRut(data.rut) &&
            data.fullName.trim() &&
            /.+@.+\..+/.test(data.email) &&
            validatePhoneCL(data.phone) &&
            Number(data.income) > 0 &&
            data.seniority !== "" &&
            data.existingDebt !== ""
        );
    }, [data]);

    const canNext2 = useMemo(() => Number(data.amount) > 0 && Number(data.term) > 0, [data]);

    const monthlyPayment = useMemo(() => {
        return estimateMonthlyPayment(Number(data.amount) || 0, Number(data.term) || 0, 0.019);
    }, [data.amount, data.term]);

    // Obtener recomendación al pasar al paso 2
    async function getRecommendation() {
        setLoadingRec(true);
        try {
            const res = await fetch(`/api/loans/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    income: Number(data.income),
                    seniority: Number(data.seniority),
                    existing_debt: Number(data.existingDebt)
                }),
            });
            if (res.ok) {
                const rec = await res.json();
                setRecommendation(rec);
                setSimulatedProb(rec.probabilidad);
                // Sugerimos los valores al usuario
                setData(prev => ({
                    ...prev,
                    amount: String(rec.monto),
                    term: String(rec.plazo)
                }));
            }
        } catch (e) {
            console.error("Rec failed", e);
        } finally {
            setLoadingRec(false);
        }
    }

    // Simular dinámicamente
    async function simulate(amount, term) {
        try {
            const res = await fetch(`/api/loans/simulate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    income: Number(data.income),
                    amount: Number(amount),
                    term: Number(term),
                    seniority: Number(data.seniority),
                    existing_debt: Number(data.existingDebt)
                }),
            });
            if (res.ok) {
                const result = await res.json();
                setSimulatedProb(result.probabilidad);
            }
        } catch (e) {
            console.error("Simulation failed", e);
        }
    }

    const handleStep1Next = () => {
        getRecommendation();
        setStep(2);
    };

    const handleAmountChange = (val) => {
        setData({ ...data, amount: String(val) });
        simulate(val, data.term);
    };

    const handleTermChange = (val) => {
        setData({ ...data, term: String(val) });
        simulate(data.amount, val);
    };

    async function createLoan(payload) {
        const res = await fetch(`/api/loans/apply`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // 🔥 HU #8: Enviamos el token
            },
            body: JSON.stringify({
                rut: payload.rut,
                full_name: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                amount: payload.amount,
                term_months: payload.term,
                income: payload.income ?? undefined,
                seniority: payload.seniority ?? undefined,
                existing_debt: payload.existing_debt ?? undefined,
            }),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `apply_failed_${res.status}`);
        }
        return res.json();
    }

    async function handleSubmitReal() {
        if (!token) {
            setShowAuthModal(true);
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                rut: cleanRut(data.rut), 
                fullName: data.fullName.trim(),
                email: data.email.trim(),
                phone: data.phone.trim(),
                amount: Number(data.amount),
                term: Number(data.term),
                income: Number(data.income),
                seniority: Number(data.seniority),
                existing_debt: Number(data.existingDebt),
            };
            const applied = await createLoan(payload);
            setCreatedId(String(applied.id));
            setStatus(applied.status);
            setScore(applied.scoring ?? null);
        } catch (e) {
            console.error(e);
            alert("Error al enviar solicitud: " + e.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
            {/* Modal de Autenticación Requerida */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Inicio de Sesión Requerido</h3>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Para enviar una solicitud formal y realizar el seguimiento de tu crédito, necesitas tener una cuenta activa en Banco INF.
                        </p>
                        <div className="mt-6 flex flex-col gap-3">
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full rounded-xl bg-zinc-900 dark:bg-white py-2.5 text-sm font-bold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm"
                            >
                                Iniciar Sesión
                            </button>
                            <button 
                                onClick={() => navigate('/register')}
                                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
                            >
                                Crear Cuenta Gratis
                            </button>
                            <button 
                                onClick={() => setShowAuthModal(false)}
                                className="mt-1 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                            >
                                Continuar explorando
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Formulario */}
            <section id="form" className="mx-auto max-w-6xl px-4 py-10 pb-16">
                <div className="mb-8">
                    <h2 className="text-3xl font-semibold tracking-tight dark:text-white">Simulador de Crédito</h2>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">Completa los datos para obtener una oferta personalizada.</p>
                </div>

                <div className="grid items-start gap-6 md:grid-cols-5">
                    <div className="md:col-span-3">
                        <Card>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Solicitud de Préstamo</h3>
                                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Paso {step} de 3</div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                                {["Datos", "Simulación", "Revisión"].map((t, i) => (
                                    <div key={t} className={`rounded-lg px-3 py-2 text-center font-medium transition-colors ${i + 1 <= step ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>{t}</div>
                                ))}
                            </div>

                            {/* STEP 1 */}
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="RUT" required>
                                            <input
                                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all dark:text-white"
                                                value={data.rut}
                                                inputMode="text"
                                                placeholder="12.345.678-5"
                                                onChange={(e) => setData({ ...data, rut: formatRut(e.target.value) })}
                                            />
                                            {!validateRut(data.rut) && data.rut && (
                                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">RUT inválido (formato: 12.345.678-5).</p>
                                            )}
                                        </Field>
                                        <Field label="Nombre completo" required>
                                            <input
                                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all dark:text-white"
                                                value={data.fullName}
                                                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Email" required>
                                            <input
                                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all dark:text-white"
                                                value={data.email}
                                                inputMode="email"
                                                placeholder="tucorreo@dominio.cl"
                                                onChange={(e) => setData({ ...data, email: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Teléfono" required>
                                            <input
                                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all dark:text-white"
                                                value={data.phone}
                                                inputMode="tel"
                                                placeholder="+569 12345678"
                                                maxLength={14}
                                                onChange={(e) => setData({ ...data, phone: normalizePhoneCL(e.target.value) })}
                                            />
                                        </Field>
                                        <Field label="Ingreso mensual (CLP)" required>
                                            <input
                                                type="number" min={0}
                                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all dark:text-white"
                                                value={data.income}
                                                onChange={(e) => setData({ ...data, income: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Antigüedad laboral (años)" required>
                                            <input
                                                type="number" min={0}
                                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all dark:text-white"
                                                value={data.seniority}
                                                onChange={(e) => setData({ ...data, seniority: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Deuda financiera mensual (CLP)" required>
                                            <input
                                                type="number" min={0}
                                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all dark:text-white"
                                                value={data.existingDebt}
                                                placeholder="Suma de cuotas de otros créditos"
                                                onChange={(e) => setData({ ...data, existingDebt: e.target.value })}
                                            />
                                        </Field>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm mt-4">
                                        <input
                                            id="acc" type="checkbox"
                                            className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                                            checked={data.accept}
                                            onChange={(e) => setData({ ...data, accept: e.target.checked })}
                                        />
                                        <label htmlFor="acc" className="text-zinc-600 dark:text-zinc-400 leading-tight">
                                            Acepto los términos y condiciones, y autorizo la evaluación de mis antecedentes comerciales.
                                        </label>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2 */}
                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
                                    {loadingRec && (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                                            <span className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Calculando tu oferta óptima...</span>
                                        </div>
                                    )}

                                    {!loadingRec && recommendation && (
                                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                                            <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-900 border-indigo-200 dark:border-indigo-800">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                                                        <Sparkles className="h-4 w-4" />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-wider">Oferta Recomendada</h4>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Monto sugerido</p>
                                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">${recommendation.monto.toLocaleString("es-CL")}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Plazo sugerido</p>
                                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{recommendation.plazo} meses</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setData({...data, amount: String(recommendation.monto), term: String(recommendation.plazo)});
                                                        setSimulatedProb(recommendation.probabilidad);
                                                    }}
                                                    className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow"
                                                >
                                                    APLICAR RECOMENDACIÓN
                                                </button>
                                            </Card>
                                        </motion.div>
                                    )}

                                    <div className="space-y-8 px-2">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Monto solicitado</span>
                                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${Number(data.amount).toLocaleString("es-CL")}</span>
                                            </div>
                                            <input 
                                                type="range" min="500000" max="20000000" step="100000"
                                                className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                value={data.amount}
                                                onChange={(e) => handleAmountChange(e.target.value)}
                                            />
                                            <div className="flex justify-between text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-2">
                                                <span>$500.000</span>
                                                <span>$20.000.000</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Plazo del crédito</span>
                                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.term} meses</span>
                                            </div>
                                            <input 
                                                type="range" min="6" max="60" step="6"
                                                className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                value={data.term}
                                                onChange={(e) => handleTermChange(e.target.value)}
                                            />
                                            <div className="flex justify-between text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-2">
                                                <span>6 meses</span>
                                                <span>60 meses</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 p-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
                                                <CalendarClock className="h-3.5 w-3.5" /> Cuota estimada
                                            </div>
                                            <div className="text-2xl font-bold text-zinc-900 dark:text-white">${monthlyPayment.toLocaleString("es-CL")}</div>
                                        </div>
                                        <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 p-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Probabilidad
                                            </div>
                                            <div className={`text-2xl font-bold ${simulatedProb > 70 ? "text-emerald-600 dark:text-emerald-400" : simulatedProb > 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                                                {simulatedProb}%
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3 */}
                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/30 p-6">
                                        <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <FileSignature className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                                            Revisión Final de Datos
                                        </h4>
                                        <dl className="mt-6 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            <div><dt className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Nombre del Solicitante</dt><dd className="mt-1 font-medium text-zinc-900 dark:text-white">{data.fullName || "—"}</dd></div>
                                            <div><dt className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Ingresos Declarados</dt><dd className="mt-1 font-medium text-zinc-900 dark:text-white">${Number(data.income || 0).toLocaleString("es-CL")}</dd></div>
                                            <div><dt className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Antigüedad Laboral</dt><dd className="mt-1 font-medium text-zinc-900 dark:text-white">{data.seniority} años</dd></div>
                                            <div><dt className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Deuda Externa</dt><dd className="mt-1 font-medium text-zinc-900 dark:text-white">${Number(data.existingDebt || 0).toLocaleString("es-CL")}</dd></div>
                                            <div className="col-span-full border-t border-zinc-100 dark:border-zinc-800 pt-4"></div>
                                            <div><dt className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Monto del Crédito</dt><dd className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">${Number(data.amount || 0).toLocaleString("es-CL")}</dd></div>
                                            <div><dt className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Plazo en Meses</dt><dd className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">{data.term} meses</dd></div>
                                            <div><dt className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Cuota Mensual</dt><dd className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">${monthlyPayment.toLocaleString("es-CL")}</dd></div>
                                            <div><dt className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Probabilidad</dt><dd className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">{simulatedProb}%</dd></div>
                                        </dl>
                                    </div>
                                    {!data.accept && (
                                        <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-400">
                                            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                            <span>Debes confirmar que has leído los términos y condiciones antes de enviar la solicitud.</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Navegación */}
                            <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                                {!createdId && (
                                    <button
                                        disabled={step === 1}
                                        onClick={() => setStep((s) => (s > 1 ? s - 1 : s))}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Volver
                                    </button>
                                )}

                                {step === 1 ? (
                                    <button
                                        disabled={!canNext1 || !data.accept}
                                        onClick={handleStep1Next}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-sm font-bold text-white dark:text-zinc-900 disabled:opacity-30 hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all"
                                    >
                                        Continuar a simulación <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : step === 2 ? (
                                    <button
                                        disabled={!canNext2}
                                        onClick={() => setStep(3)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-sm font-bold text-white dark:text-zinc-900 disabled:opacity-30 hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all"
                                    >
                                        Revisar solicitud <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : !createdId ? (
                                    <button
                                        disabled={!data.accept || submitting}
                                        onClick={handleSubmitReal}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-sm font-bold text-white dark:text-zinc-900 disabled:opacity-30 hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white dark:border-zinc-900 border-t-transparent" />
                                                Enviando...
                                            </>
                                        ) : "Enviar solicitud final"}
                                    </button>
                                ) : (
                                    <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                        <CheckCircle2 className="h-4 w-4" /> Solicitud enviada con éxito
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Columna derecha: estado */}
                    <div className="space-y-6 md:col-span-2" id="estado">
                        <Card>
                            <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Estado de Proceso</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1 rounded-full ${createdId ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"}`}>
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${createdId ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}>Registro de Solicitud</span>
                                        {createdId && <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">ID: #{createdId}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`p-1 rounded-full ${status === "inadmisible" || status === "rechazada" || status === "aprobada" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"}`}>
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <span className={`text-sm font-bold ${status ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}>Validación de Datos</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`p-1 rounded-full ${status === "rechazada" || status === "aprobada" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"}`}>
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <span className={`text-sm font-bold ${status === "rechazada" || status === "aprobada" ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}>Evaluación Crediticia</span>
                                </div>
                            </div>

                            <div className="mt-6 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                                {!status && (
                                    <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 italic">
                                        Completa la solicitud para ver tu estado en tiempo real.
                                    </div>
                                )}
                                {status === "inadmisible" && (
                                    <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                        <p className="text-sm font-medium">No se cumplen los criterios mínimos de ingreso para procesar esta solicitud.</p>
                                    </div>
                                )}
                                {status === "rechazada" && (
                                    <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
                                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                        <p className="text-sm font-medium">Solicitud rechazada. El perfil de riesgo actual no permite la aprobación.</p>
                                    </div>
                                )}
                                {status === "aprobada" && (
                                    <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
                                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold">¡Solicitud Aprobada!</p>
                                            <p className="text-xs font-medium mt-1">Tu puntaje de scoring es: <span className="font-bold">{score} / 100</span></p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Botones de acción post-envío */}
                            {createdId && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800"
                                >
                                    {token ? (
                                        <button 
                                            onClick={() => navigate('/dashboard')}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                                        >
                                            <LayoutDashboard className="h-4 w-4" />
                                            Ver en mi Dashboard
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Haz seguimiento a tu crédito</p>
                                            <button 
                                                onClick={() => navigate('/register')}
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white py-3 text-sm font-bold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg shadow-zinc-200 dark:shadow-none"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                Crear Cuenta Gratis
                                            </button>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
                                                Regístrate con tu RUT para gestionar tus pagos y revisar el avance de tu solicitud.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </Card>
                    </div>
                </div>
            </section>

            <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-10 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 transition-colors">
                © {new Date().getFullYear()} Banco INF · Plataforma de Solicitud Digital · V2.4.0
            </footer>
        </div>
    );
}
