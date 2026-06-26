/**
 * Sistema de logging para mejorar la disponibilidad y el diagnóstico.
 * Registra eventos importantes para permitir la recuperación ante fallas.
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, 'logs');
        fs.mkdirSync(this.logDir, { recursive: true });
    }

    _formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length ? ` | Context: ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}\n`;
    }

    _write(level, message, context) {
        const logMessage = this._formatMessage(level, message, context);
        
        // Mostrar en consola (estándar actual)
        if (level === 'error') {
            console.error(logMessage.trim());
        } else {
            console.log(logMessage.trim());
        }

        // Persistir en archivo para auditoría y recuperación
        const fileName = `log-${new Date().toISOString().split('T')[0]}.log`;
        try {
            fs.appendFileSync(path.join(this.logDir, fileName), logMessage);
        } catch (e) {
            console.error('Error al escribir log en archivo:', e.message);
        }
    }

    info(message, context) {
        this._write('info', message, context);
    }

    warn(message, context) {
        this._write('warn', message, context);
    }

    error(message, context) {
        this._write('error', message, context);
    }
}

module.exports = new Logger();
