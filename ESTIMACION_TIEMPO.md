# Estimación de Tiempo de Desarrollo

Este documento detalla el tiempo teórico invertido en la implementación de las mejoras arquitectónicas y técnicas solicitadas para las historias de usuario (HUs) #1, #2 y #8. La estimación se basa en un esfuerzo humano estándar.

## Resumen de Cambios y Tiempos

| Tarea / Historia de Usuario | Descripción Técnica | Tiempo Estimado (HH) |
| :--- | :--- | :---: |
| **HU #2: Simulación de Préstamo** | Refactorización de la lógica de cálculo utilizando el patrón **Strategy**. Desacoplamiento de las reglas financieras de la interfaz de rutas para mejorar la modificabilidad. | 3.0 |
| **HU #1: Solicitar Préstamo** | Implementación de un sistema de **Logging** con persistencia en archivos y una capa de persistencia temporal (**Drafts**) para solicitudes en curso, mejorando la disponibilidad y recuperación ante fallas. | 4.0 |
| **HU #8: Validación de Identidad** | Implementación de **Autorización Estricta** en el backend. Verificación de roles y propiedad de recursos (RUT) en todas las rutas críticas (aplicación, detalle de préstamo, pagos), no limitándose a la interfaz visual. | 3.0 |
| **Normalización de UI** | Actualización de la interfaz del simulador de crédito para alinearla con el sistema de diseño del banco (colores, tipografía, componentes light theme). | 4.0 |
| **Modo Oscuro Predeterminado** | Implementación de **Dark Mode** como tema base de la plataforma con configuración manual de variantes para Tailwind v4, integración de toggle funcional y consolidación de cabeceras. | 7.5 |
| **Identidad Visual y Componentes** | Integración del logotipo corporativo (`iconobanco.png`) y sustitución de alertas de navegador por **Modales Personalizados** de alta fidelidad para mejorar la experiencia de marca. | 1.0 |
| **Integración y Pruebas** | Pruebas de regresión, verificación de la integridad de la base de datos y validación de los nuevos esquemas de seguridad. | 2.0 |
| **TOTAL** | | **24.5** |

## Detalles de Implementación

### 1. Refactorización (Patrones de Diseño)
Se aisló la lógica matemática en `calculadora.js` creando una arquitectura extensible. Esto permite que futuros cambios en los sistemas de amortización (ej: pasar de Sistema Francés a Alemán) se realicen simplemente inyectando una nueva estrategia, sin alterar el resto del código.

### 2. Disponibilidad y Trazabilidad
El nuevo sistema de logging permite un seguimiento detallado de errores y eventos de negocio. El guardado de borradores asegura que, ante cualquier interrupción de red o cierre inesperado, el usuario pueda retomar su solicitud exactamente donde la dejó.

### 3. Seguridad de Extremo a Extremo
Se eliminó la dependencia exclusiva de las protecciones del frontend. Ahora, cada petición al servidor valida que el token JWT no solo sea válido, sino que el usuario tenga los permisos específicos para acceder o modificar los datos del RUT solicitado.

### 4. Normalización de Experiencia de Usuario (UI/UX)
Se rediseñó completamente la vista del simulador de crédito (`LoanRequestView.jsx`). Se migró de un tema oscuro personalizado a un tema claro integrado con el resto del portal, utilizando la paleta de colores corporativa (Zinc/Indigo/Emerald).

### 5. Modo Oscuro Nativo por Defecto y Corrección de Toggle
Se implementó un sistema de temas dinámico donde el **Modo Oscuro es el estándar de inicio**. Se configuró explícitamente la variante `dark` en el CSS global para compatibilidad con Tailwind CSS v4, asegurando que el botón de cambio de tema sea totalmente funcional y persistente.

### 6. Componentes de Comunicación
Se reemplazaron las alertas nativas del navegador por **modales reactivos estilizados**. Esto permite una comunicación más suave y profesional con el cliente, guiándolo hacia el registro o inicio de sesión sin interrumpir el flujo visual de la aplicación.
