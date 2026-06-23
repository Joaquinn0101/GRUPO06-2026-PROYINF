import { createContext, useContext, useState, useEffect } from 'react';

// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
    return useContext(AuthContext);
};

// Utilidad para verificar si un token JWT está expirado
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp está en segundos, Date.now() en milisegundos
        return payload.exp * 1000 < Date.now();
    } catch {
        return true; // Si no se puede decodificar, se considera expirado
    }
}

// 3. Creamos el Proveedor (el componente que envolverá nuestra app)
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Este Efecto se ejecuta UNA VEZ cuando la app carga
    // Revisa si ya tenemos un token guardado en el navegador
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            // Verificar si el token está expirado
            if (isTokenExpired(storedToken)) {
                // Token expirado: limpiar todo
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } else {
                try {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    // JSON corrupto: limpiar localStorage
                    console.error('Error al parsear usuario almacenado:', e);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
        }
        setIsLoading(false);
    }, []);

    // Función para Iniciar Sesión
    const login = (data) => {
        // data viene de la API de /login O /register
        setToken(data.token);
        
        const userData = { 
            id: data.user_id, 
            name: data.full_name,
            rut: data.rut,
            email: data.email,
            role: data.role
        };
        setUser(userData);

        // Guardamos en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    // Función para Cerrar Sesión
    const logout = () => {
        setToken(null);
        setUser(null);
        
        // Limpiamos localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    // El "valor" que compartiremos con toda la app
    const value = {
        token,
        user,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};