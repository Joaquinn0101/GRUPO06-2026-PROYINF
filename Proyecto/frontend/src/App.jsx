import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Moon, Sun } from 'lucide-react';

// Importamos todas nuestras páginas
import Landing from './pages/Landing.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoanRequestView from "./LoanRequestView";
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage.jsx';
import LoanReviewPage from './pages/LoanReviewPage.jsx';

// 🔹 Nuevo: portal de pagos
import PaymentPortalPage from './pages/PaymentPortalPage.jsx';

const Navbar = () => {
    const { token, user, logout } = useAuth();
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        // Por defecto: Oscuro
        return true;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    return (
        <nav className="bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50 backdrop-blur">
            <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2">
                    <img src="/iconobanco.png" alt="Banco INF Logo" className="h-8 w-8 object-contain" />
                    <span className="text-sm font-semibold tracking-tight dark:text-white transition-colors">Banco INF</span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link to="/loan" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        Simulador
                    </Link>

                    {token ? (
                        <>
                            {user?.role === 'executive' ? (
                                <Link
                                    to="/admin/dashboard"
                                    className="text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors"
                                >
                                    Panel Ejecutivo
                                </Link>
                            ) : (
                                <Link
                                    to="/dashboard"
                                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                >
                                    Mi Dashboard
                                </Link>
                            )}
                            <button
                                onClick={logout}
                                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:shadow-sm transition-all"
                            >
                                Cerrar Sesión
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm hover:shadow transition-all"
                            >
                                Registro
                            </Link>
                        </>
                    )}

                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        aria-label="Toggle dark mode"
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>
        </nav>
    );
}

function App() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
            <Navbar />
            <Routes>
                {/* Rutas Públicas */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/loan" element={<LoanRequestView />} />

                {/* Rutas Protegidas Cliente */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute requiredRole="client">
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />

                {/* 🔹 Nuevo: Portal de pagos protegido */}
                <Route
                    path="/portal-pagos/:loanId"
                    element={
                        <ProtectedRoute requiredRole="client">
                            <PaymentPortalPage />
                        </ProtectedRoute>
                    }
                />

                {/* Rutas Protegidas Ejecutivo */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute requiredRole="executive">
                            <ExecutiveDashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/review/:id"
                    element={
                        <ProtectedRoute requiredRole="executive">
                            <LoanReviewPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<h2 className="p-10 text-center dark:text-white">404 - Página no encontrada</h2>} />
            </Routes>
        </div>
    );
}

export default App;
