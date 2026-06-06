import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileDown, FileText, CreditCard, PenTool } from 'lucide-react'; // Nuevo ícono PenTool

const DashboardPage = () => {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Función para cargar los datos (la sacamos del useEffect para poder reusarla)
    const fetchDashboardData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('/api/loans/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('No se pudo cargar la información.');
            const data = await response.json();
            setDashboardData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [token]);

    const handleGoToPayment = (loanId) => {
        navigate(`/portal-pagos/${loanId}`);
    };

    // --- NUEVA FUNCIÓN: FIRMAR CONTRATO ---
    const handleSignContract = async (loanId) => {
        if (!confirm("¿Estás seguro de firmar el contrato digitalmente?")) return;

        try {
            const response = await fetch(`/api/loans/${loanId}/sign`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error("Error al firmar");

            // Recargamos los datos para ver el cambio de estado
            alert("¡Contrato firmado exitosamente!");
            fetchDashboardData(); 

        } catch (err) {
            alert(err.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getStatusLabel = (status) => {
        if (status === 'aprobada') return 'Lista para firma digital';
        if (status === 'cursada') return 'Vigente (Firmado)';
        if (status === 'pendiente') return 'En evaluación';
        if (status === 'rechazada') return 'No cumple requisitos';
        return status;
    };

    const getStatusColor = (status) => {
        if (status === 'aprobada') return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
        if (status === 'cursada') return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        if (status === 'rechazada') return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    };

    if (!user) return <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">Cargando sesión...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 transition-colors">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Bienvenido, {user.name}</h2>
                        <p className="text-zinc-500 dark:text-zinc-400">Resumen de tu cuenta</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                {loading && <p className="text-center py-10 text-zinc-500 dark:text-zinc-400">Cargando...</p>}
                {error && <p className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 transition-all">{error}</p>}

                {dashboardData && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-colors">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Mis Solicitudes</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">RUT asociado: {dashboardData.rut}</p>
                        </div>

                        <div className="p-6">
                            {dashboardData.loan_requests?.length > 0 ? (
                                <ul className="space-y-4">
                                    {dashboardData.loan_requests.map(loan => (
                                        <li key={loan.id} className="group relative bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 hover:shadow-md transition-all">
                                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                                
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                                            Solicitud #{loan.id}
                                                        </span>
                                                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                            {new Date(loan.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-zinc-900 dark:text-white transition-colors">
                                                        ${new Intl.NumberFormat('es-CL').format(loan.amount)}
                                                    </div>
                                                    <div className="text-sm text-zinc-500 dark:text-zinc-400 transition-colors">
                                                        a {loan.term_months} meses
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${getStatusColor(loan.status)}`}>
                                                        {getStatusLabel(loan.status)}
                                                    </span>

                                                    {/* --- ACCIONES --- */}
                                                    
                                                    {/* 1. APROBADA: Ver Contrato y FIRMAR */}
                                                    {loan.status === 'aprobada' && (
                                                        <div className="flex flex-col items-end gap-2">
                                                            <button 
                                                                className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline transition-all"
                                                                onClick={() => alert("Descargando borrador...")}
                                                            >
                                                                <FileDown className="h-4 w-4" />
                                                                Ver borrador
                                                            </button>
                                                            
                                                            <button 
                                                                onClick={() => handleSignContract(loan.id)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 text-sm font-bold rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all shadow-sm"
                                                            >
                                                                <PenTool className="h-4 w-4" />
                                                                Firmar Contrato
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* 2. CURSADA: Pagar */}
                                                    {loan.status === 'cursada' && (
                                                        <button 
                                                            onClick={() => handleGoToPayment(loan.id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white dark:text-zinc-950 text-sm font-bold rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all shadow-sm"
                                                        >
                                                            <CreditCard className="h-4 w-4" />
                                                            Ir a portal de pagos
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="h-6 w-6 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
                                    <h3 className="text-zinc-900 dark:text-white font-medium transition-colors">No tienes solicitudes activas</h3>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
