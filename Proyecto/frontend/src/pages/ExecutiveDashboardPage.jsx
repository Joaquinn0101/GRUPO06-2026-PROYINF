import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ExecutiveDashboardPage = () => {
    const { token } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch('/api/loans/admin/requests', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar las solicitudes');
                }

                const data = await response.json();
                setRequests(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [token]);

    if (loading) return <div className="p-8 text-center">Cargando solicitudes...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Panel de Evaluación - Ejecutivo</h1>
            
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-zinc-600">ID</th>
                            <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Cliente</th>
                            <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Monto</th>
                            <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Scoring</th>
                            <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Estado</th>
                            <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-zinc-900">#{req.id}</td>
                                <td className="px-6 py-4 text-sm text-zinc-900">
                                    <div>{req.full_name}</div>
                                    <div className="text-xs text-zinc-500">{req.rut}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-900">
                                    ${Number(req.amount).toLocaleString('es-CL')}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        req.scoring >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {req.scoring} pts
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        req.status === 'aprobada' ? 'bg-emerald-100 text-emerald-700' :
                                        req.status === 'rechazada' ? 'bg-rose-100 text-rose-700' :
                                        'bg-zinc-100 text-zinc-700'
                                    }`}>
                                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <Link 
                                        to={`/admin/review/${req.id}`}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                                    >
                                        Revisar
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {requests.length === 0 && (
                    <div className="p-8 text-center text-zinc-500">No hay solicitudes pendientes.</div>
                )}
            </div>
        </div>
    );
};

export default ExecutiveDashboardPage;
