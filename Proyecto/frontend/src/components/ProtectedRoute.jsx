import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    // 1. Obtenemos el token, usuario y estado de carga desde el contexto
    const { token, user, isLoading } = useAuth();

    // 2. Si aún estamos cargando la sesión, mostramos un spinner
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <p className="text-zinc-500 dark:text-zinc-400 animate-pulse">Verificando sesión...</p>
            </div>
        );
    }

    if (!token) {
        // 3. Si NO hay token, redirigimos al login
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        // 4. Si el rol no coincide, redirigimos a home
        return <Navigate to="/" replace />;
    }

    // 5. Si TODO está OK, mostramos el componente hijo
    return children;
};

export default ProtectedRoute;