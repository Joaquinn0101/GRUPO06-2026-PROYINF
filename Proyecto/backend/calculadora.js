/**
 * Strategy Pattern para el cálculo de cuotas de préstamos.
 * Aísla la lógica matemática de la interfaz y facilita la modifiabilidad.
 */

class LoanCalculationStrategy {
    calculateInstallment(amount, annualRate, termMonths) {
        throw new Error("Method 'calculateInstallment' must be implemented.");
    }
}

class FrenchSystemStrategy extends LoanCalculationStrategy {
    calculateInstallment(amount, annualRate, termMonths) {
        if (annualRate <= 0 || termMonths <= 0 || amount <= 0) {
            return 0.0;
        }

        const monthlyRate = (annualRate / 100) / 12;

        if (monthlyRate === 0) {
            return parseFloat((amount / termMonths).toFixed(2));
        }

        // Fórmula del Sistema Francés: C = P * i / (1 - (1 + i)^-n)
        const numerator = amount * monthlyRate;
        const denominator = 1 - Math.pow(1 + monthlyRate, -termMonths);

        const installment = numerator / denominator;
        return parseFloat(installment.toFixed(2));
    }
}

// Contexto que utiliza la estrategia
class LoanCalculator {
    constructor(strategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy) {
        this.strategy = strategy;
    }

    calculate(amount, annualRate, termMonths) {
        return this.strategy.calculateInstallment(amount, annualRate, termMonths);
    }
}

// Instancia por defecto para mantener compatibilidad
const defaultCalculator = new LoanCalculator(new FrenchSystemStrategy());

/**
 * Función mock para obtener la tasa de interés según el plazo.
 * Centralizada aquí para facilitar cambios globales en las reglas financieras.
 */
function obtenerTasaMock(plazoMeses) {
    if (plazoMeses <= 12) return 5.5;
    if (plazoMeses <= 36) return 6.0;
    return 7.5;
}

// Fachada para mantener compatibilidad con el resto del sistema
function calcularCuotaMensual(montoPrestamo, tasaAnual, plazoMeses) {
    return defaultCalculator.calculate(montoPrestamo, tasaAnual, plazoMeses);
}

module.exports = {
    calcularCuotaMensual,
    obtenerTasaMock,
    LoanCalculator,
    FrenchSystemStrategy
};
