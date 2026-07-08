// Devuelve el número de semana ISO-8601 (1-53) y el año correspondiente.
// El año ISO puede diferir del año natural en los días límite de diciembre/enero.
export const getIsoWeek = (date: Date = new Date()): { year: number; weekNumber: number } => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // domingo = 7, no 0
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); // mover al jueves de esa semana
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return { year: d.getUTCFullYear(), weekNumber };
};