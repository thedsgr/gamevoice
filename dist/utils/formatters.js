/**
 * Este arquivo contém funções utilitárias para formatação de dados.
 * A função `formatDuration` converte uma duração em milissegundos para
 * um formato legível, como "2 dias, 3 horas, 15 minutos, 20 segundos".
 */
/**
 * Formata uma duração em milissegundos para um formato legível.
 * @param ms - Duração em milissegundos.
 * @returns Uma string representando a duração formatada.
 */
export function formatDuration(ms) {
    if (ms < 0)
        return '0 segundos'; // Garante que valores negativos sejam tratados
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const parts = [];
    if (days > 0)
        parts.push(`${days} dia${days > 1 ? 's' : ''}`);
    if (hours > 0)
        parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
    if (minutes > 0)
        parts.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`);
    if (seconds > 0)
        parts.push(`${seconds} segundo${seconds > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ') : '0 segundos';
}
