import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoanReviewPage = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loan, setLoan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchLoanDetail = async () => {
            try {
                const response = await fetch(`/api/loans/admin/requests/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('No se pudo cargar el detalle del préstamo');
                }

                const data = await response.json();
                setLoan(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLoanDetail();
    }, [id, token]);

    const handleDecision = async (status) => {
        if (!window.confirm(`¿Estás seguro de que deseas ${status} esta solicitud?`)) return;

        setSubmitting(true);
        try {
            const response = await fetch(`/api/loans/admin/requests/${id}/evaluate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error('Error al registrar la decisión');
            }

            alert(`Solicitud ${status} correctamente.`);
            navigate('/admin/dashboard');
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando detalle...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!loan) return <div className="p-8 text-center">No se encontró la solicitud.</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button 
                onClick={() => navigate('/admin/dashboard')}
                className="mb-6 text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-2"
            >
                ← Volver al panel
            </button>

            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-zinc-200 bg-zinc-50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">Detalle de Solicitud #{loan.id}</h1>
                            <p className="text-zinc-500 mt-1">Recibida el {new Date(loan.created_at).toLocaleDateString('es-CL')}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                            loan.status === 'aprobada' ? 'bg-emerald-100 text-emerald-700' :
                            loan.status === 'rechazada' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Información del Cliente */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold border-b pb-2">Datos del Cliente</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Nombre</p>
                                <p className="text-sm font-medium">{loan.full_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">RUT</p>
                                <p className="text-sm font-medium">{loan.rut}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Email</p>
                                <p className="text-sm font-medium">{loan.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Teléfono</p>
                                <p className="text-sm font-medium">{loan.phone || 'No registrado'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Información del Préstamo */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold border-b pb-2">Resumen de Solicitud</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Monto Solicitado</p>
                                <p className="text-lg font-bold text-indigo-600">${Number(loan.amount).toLocaleString('es-CL')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Plazo</p>
                                <p className="text-sm font-medium">{loan.term_months} meses</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Ingresos Informados</p>
                                <p className="text-sm font-medium">${Number(loan.income || 0).toLocaleString('es-CL')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Scoring Automático</p>
                                <p className={`text-sm font-bold ${loan.scoring >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {loan.scoring} puntos
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Documentación (AC 2) */}
                    <div className="col-span-full space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">Documentación Adjunta</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-zinc-200 rounded-xl p-4 flex justify-between items-center hover:bg-zinc-50 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">PDF</div>
                                    <div>
                                        <p className="text-sm font-semibold">Liquidaciones de Sueldo</p>
                                        <p className="text-xs text-zinc-500">Subido el {new Date(loan.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-indigo-600 font-bold">VER DOCUMENTO</span>
                            </div>

                            <div className="border border-zinc-200 rounded-xl p-4 flex justify-between items-center hover:bg-zinc-50 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">IMG</div>
                                    <div>
                                        <p className="text-sm font-semibold">Comprobante de Domicilio</p>
                                        <p className="text-xs text-zinc-500">Subido el {new Date(loan.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-blue-600 font-bold">VER IMAGEN</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acciones (AC 3) */}
                <div className="p-8 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-4">
                    <button
                        onClick={() => handleDecision('rechazada')}
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl border border-rose-300 text-rose-700 font-semibold hover:bg-rose-50 transition-colors disabled:opacity-50"
                    >
                        Rechazar Solicitud
                    </button>
                    <button
                        onClick={() => handleDecision('aprobada')}
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                    >
                        Aprobar Solicitud
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoanReviewPage;
