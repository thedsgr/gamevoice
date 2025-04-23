export function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const parts = [];
    if (days > 0)
        parts.push(`${days} dia(s)`);
    if (hours > 0)
        parts.push(`${hours} hora(s)`);
    if (minutes > 0)
        parts.push(`${minutes} minuto(s)`);
    if (seconds > 0)
        parts.push(`${seconds} segundo(s)`);
    return parts.join(', ');
}
