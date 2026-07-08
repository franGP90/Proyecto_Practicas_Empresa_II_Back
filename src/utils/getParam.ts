// Express 5 tipa req.params[key] como string | string[] (por rutas con parámetros repetidos).
// En nuestras rutas nunca usamos parámetros repetidos, así que siempre será string;
// este helper deja eso explícito y centraliza el manejo del caso array.
export const getParam = (value: string | string[]): string => {
    return Array.isArray(value) ? value[0] : value;
};