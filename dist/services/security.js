// src/services/security.ts
const cooldowns = new Map();
/**
 * Verifica se o usuário está em cooldown.
 * @param userId - O ID do usuário.
 * @param seconds - O tempo de cooldown em segundos.
 * @returns `true` se o usuário ainda estiver em cooldown, caso contrário `false`.
 */
export function isOnCooldown(userId, seconds) {
    const lastUsed = cooldowns.get(userId);
    if (!lastUsed)
        return false;
    const now = Date.now();
    return now - lastUsed < seconds * 1000;
}
/**
 * Define o cooldown para o usuário.
 * @param userId - O ID do usuário.
 */
export function setCooldown(userId) {
    cooldowns.set(userId, Date.now());
}
//# sourceMappingURL=security.js.map