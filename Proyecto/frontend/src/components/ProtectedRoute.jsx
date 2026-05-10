import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    // 1. Obtenemos el token y el usuario desde nuestro "cerebro"
    const { token, user } = useAuth();

    if (!token) {
        // 2. Si NO hay token, redirigimos al login
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        // 3. Si el rol no coincide, redirigimos a home con mensaje (simulado aquí por redirección)
        alert("Acceso Denegado: No tienes permisos para acceder a esta página.");
        return <Navigate to="/" replace />;
    }

    // 4. Si TODO está OK, mostramos el componente hijo
    return children;
};

export default ProtectedRoute;