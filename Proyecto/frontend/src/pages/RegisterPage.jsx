import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react'; // 1. Importamos los íconos

// Función simple para limpiar el RUT
const normalizeRut = (rut = "") => {
    if (!rut || typeof rut !== 'string') return "";
    return rut.replace(/[\.\-\s]/g, '').toUpperCase();
}

// Función para formatear RUT mientras se escribe (12.345.678-9)
const formatRut = (value) => {
    // Limpiar todo lo que no sea números o K
    let clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (!clean) return '';

    // Separar dígito verificador
    let dv = clean.slice(-1);
    let cuerpo = clean.slice(0, -1);

    // Formatear cuerpo con puntos
    if (cuerpo.length > 0) {
        cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${cuerpo}-${dv}`;
    }
    return dv;
}

const RegisterPage = () => {
    const [rut, setRut] = useState('');
    const [full_name, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false); // 🔹 Estado para mostrar password
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const auth = useAuth();

    const handleRutChange = (e) => {
        const formatted = formatRut(e.target.value);
        if (formatted.length <= 13) { // Limitar largo máximo estándar
            setRut(formatted);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // Para enviar al backend, lo enviamos limpio (sin puntos ni guion)
        const cleanRut = rut.replace(/[\.\-]/g, '').toUpperCase(); 

        try {
            const response = await fetch('/api/loans/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    rut: cleanRut, 
                    full_name, 
                    email, 
                    password
                }),
            });
            
            // Primero, intentamos leer la respuesta como JSON
            const data = await response.json();

            // Si la respuesta NO es 201 (OK), lanzamos el error que vino de la API
            if (!response.ok) {
                // data.error ahora será "RUT inválido" o "El RUT... ya existe"
                throw new Error(data.error || 'Error al registrar la cuenta.');
            }

            // Si todo está OK (201), logueamos y redirigimos
            auth.login(data);
            
            navigate('/dashboard');

        } catch (err) {
            // Este catch ahora recibe el "Unexpected end of JSON" O el error de la API
            
            // Si el error es el "Unexpected end..." significa que el backend CRASHEÓ
            if (err.name === 'SyntaxError') {
                setError('Error grave del servidor. Contacte a soporte.');
            } else {
                // Si no, es un error de negocio (ej. "RUT inválido")
                setError(err.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-3xl font-semibold text-center text-zinc-900 dark:text-white mb-6">Crear Cuenta</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">RUT</label>
                        <input 
                            type="text" 
                            value={rut}
                            onChange={handleRutChange}
                            className="mt-1 w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 transition-all"
                            required 
                            placeholder="Ej: 12.345.678-K o 1.234.567-K"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nombre Completo</label>
                        <input 
                            type="text" 
                            value={full_name}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white transition-all"
                            required 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white transition-all"
                            required 
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Contraseña</label>
                        <div className="relative mt-1">
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white pr-10 transition-all"
                                minLength={6}
                                required 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>



                    {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

                    <button 
                        type="submit"
                        className="w-full py-2.5 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:ring-offset-2 transition-all shadow-md"
                    >
                        Crear cuenta
                    </button>
                </form>

                <p className="text-sm text-center text-zinc-600 dark:text-zinc-400 mt-6">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
