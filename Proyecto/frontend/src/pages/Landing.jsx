import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowRight, ShieldCheck, Calculator, FileText, CheckCircle2,
    CreditCard, Banknote, HandCoins, Sparkles
} from "lucide-react";

/* ====== Componentes auxiliares ====== */
function Benefit({ icon, title, desc }) {
    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold dark:text-white">
                <span className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-700 dark:text-zinc-300">{icon}</span>
                {title}
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{desc}</p>
        </div>
    );
}

function ProductCard({ icon, title, desc, bullets = [], ctaLabel = "Conocer", to = "#" }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute right-[-40%] top-[-40%] h-40 w-40 rounded-full bg-gradient-to-tr from-indigo-200/40 to-emerald-200/40 blur-2xl transition-transform group-hover:scale-125" />
            <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-700 dark:text-zinc-300">
                    {icon}<span className="text-sm font-semibold">{title}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{desc}</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600"/><span>{b}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4">
                    {to === "#" ? (
                        <button className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-200">{ctaLabel}</button>
                    ) : (
                        <Link to={to} className="rounded-xl bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900">{ctaLabel}</Link>
                    )}
                </div>
            </div>
        </div>
    );
}

function Feature({ icon, title, children }) {
    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 text-sm dark:text-white">
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-700 dark:text-zinc-300">{icon}</div>
                <div className="font-semibold">{title}</div>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{children}</p>
        </div>
    );
}

function Step({ number, title, children }) {
    return (
        <li className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 dark:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{number}</div>
                <div className="font-semibold">{title}</div>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{children}</p>
        </li>
    );
}

function Faq({ q, a }) {
    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
            <div className="font-medium dark:text-white">{q}</div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{a}</p>
        </div>
    );
}

function FooterCol({ title, links = [] }) {
    return (
        <div>
            <div className="text-sm font-semibold dark:text-white">{title}</div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                {links.map((l, i) => (
                    <li key={i}><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">{l}</a></li>
                ))}
            </ul>
        </div>
    );
}

/* ====== Landing page ====== */
export default function Landing() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
            {/* Promo strip */}
            <div className="relative z-50 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 dark:from-indigo-950/20 dark:via-sky-950/20 dark:to-emerald-950/20">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs text-zinc-700 dark:text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500"/>
            Tasas preferentes para clientes con pago automático.
          </span>
                    <Link to="/loan" className="font-medium underline-offset-2 hover:underline dark:text-indigo-400">Simula tu crédito</Link>
                </div>
            </div>

            {/* Hero */}
            <section className="relative isolate overflow-hidden">
                <div className="pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/70 via-sky-200/60 to-emerald-200/70 dark:from-indigo-900/30 dark:via-sky-900/20 dark:to-emerald-900/30 blur-3xl" />
                <div className="mx-auto max-w-6xl px-4 py-14 md:py-18">
                    <div className="grid items-center gap-10 md:grid-cols-2">
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:0.4}}>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                <ShieldCheck className="h-3.5 w-3.5"/> Seguridad nivel bancario
              </span>
                            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl dark:text-white">
                                Finanzas claras, decisiones simples.
                            </h1>
                            <p className="mt-4 max-w-prose text-[15px] text-zinc-600 dark:text-zinc-400">
                                Simula tu <span className="font-medium text-zinc-900 dark:text-white">préstamo de consumo</span> en segundos, con una experiencia transparente.
                                Sin papeleos. 100% online.
                            </p>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <Link to="/loan" className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm hover:shadow">
                                    Comenzar simulación <ArrowRight className="h-4 w-4" />
                                </Link>
                                <a href="#productos" className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                                    Ver productos
                                </a>
                            </div>
                        </motion.div>

                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.05}}>
                            <div className="relative">
                                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-400/20 via-emerald-300/10 to-blue-400/20 blur-2xl" />
                                <div className="relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Simulador</span>
                                        <Calculator className="h-5 w-5 text-zinc-500 dark:text-zinc-400"/>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
                                            <div className="text-zinc-500 dark:text-zinc-400">Monto</div>
                                            <div className="text-lg font-semibold text-zinc-900 dark:text-white">$1.500.000</div>
                                        </div>
                                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
                                            <div className="text-zinc-500 dark:text-zinc-400">Plazo</div>
                                            <div className="text-lg font-semibold text-zinc-900 dark:text-white">24 meses</div>
                                        </div>
                                    </div>
                                    <Link to="/loan" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900">
                                        Ir al simulador
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
...
            {/* Banda de beneficios */}
            <section id="beneficios" className="border-y border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-900/50">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-3">
                    <Benefit icon={<ShieldCheck className="h-5 w-5"/>} title="Protección avanzada" desc="Autenticación fuerte y monitoreo de fraude 24/7."/>
                    <Benefit icon={<HandCoins className="h-5 w-5"/>} title="Mejores condiciones" desc="Tasas preferentes con pago automático y buen comportamiento."/>
                    <Benefit icon={<FileText className="h-5 w-5"/>} title="100% digital" desc="Solicita, evalúa y firma desde cualquier dispositivo."/>
                </div>
            </section>

            {/* Productos destacados */}
            <section id="productos" className="mx-auto max-w-6xl px-4 py-14">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold dark:text-white">Elige el producto que necesitas</h2>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Diseñados para acompañar tu día a día.</p>
                    </div>
                    <Link to="/loan" className="hidden rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-200 sm:inline-flex hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">Ver simulador</Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <ProductCard
                        icon={<CreditCard className="h-6 w-6"/>}
                        title="Tarjeta de Crédito"
                        desc="Compras en cuotas y beneficios exclusivos."
                        bullets={["Cuotas sin interés en comercios adheridos","Tecnología contactless","Gestión desde la app"]}
                        ctaLabel="Conocer más"
                    />
                    <ProductCard
                        icon={<Banknote className="h-6 w-6"/>}
                        title="Préstamo de Consumo"
                        desc="Financia tus proyectos con cuotas fijas."
                        bullets={["Simulación en segundos","Respuesta rápida","Firma digital"]}
                        ctaLabel="Simular ahora"
                        to="/loan"
                    />
                    <ProductCard
                        icon={<ShieldCheck className="h-6 w-6"/>}
                        title="Cuenta Corriente"
                        desc="Administra tu dinero con seguridad y flexibilidad."
                        bullets={["Transferencias instantáneas","Tarjeta débito incluida","Atención 24/7"]}
                        ctaLabel="Abrir cuenta"
                    />
                </div>
            </section>

            {/* Franja de confianza (logos placeholder) */}
            <section className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Confían en nuestros servicios</p>
                    <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-4 md:grid-cols-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex h-12 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">Logo {i + 1}</div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mx-auto max-w-6xl px-4 py-14">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold dark:text-white">Preguntas frecuentes</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Faq q="¿Puedo simular sin crear una cuenta?" a="Sí. La simulación es 100% abierta. Solo pedimos tus datos si decides postular."/>
                    <Faq q="¿Qué requisitos mínimos existen?" a="Ser mayor de edad, contar con cédula vigente y demostrar ingresos."/>
                    <Faq q="¿Cuánto tarda la evaluación?" a="En general, minutos. Si necesitamos más antecedentes, te lo notificaremos."/>
                    <Faq q="¿Mi información está segura?" a="Sí. Aplicamos cifrado TLS y controles de acceso estrictos."/>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <img src="/iconobanco.png" alt="Banco INF Logo" className="h-7 w-7 object-contain" />
                            <span className="text-sm font-semibold tracking-tight dark:text-white">Banco INF</span>
                        </div>
                        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Soluciones financieras simples y seguras.</p>
                    </div>
                    <FooterCol title="Productos" links={["Cuenta Corriente","Tarjeta de Crédito","Préstamo de Consumo","Inversiones"]} />
                    <FooterCol title="Soporte" links={["Centro de ayuda","Seguridad","Canales de atención","Reclamos"]} />
                    <FooterCol title="Legal" links={["Términos y condiciones","Política de privacidad","Cookies"]} />
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>© {new Date().getFullYear()} Banco INF</span>
                        <Link to="/loan" className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all">Simulador</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
