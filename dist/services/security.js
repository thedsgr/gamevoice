import { PermissionsBitField, PermissionFlagsBits } from 'discord.js';
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
/**
 * Verifica se a interação é em um servidor.
 * @param interaction - A interação do comando.
 * @returns `true` se a interação for em um servidor, caso contrário responde ao usuário e retorna `false`.
 */
export function ensureInGuild(interaction) {
    if (!interaction.guild) {
        interaction.reply({
            content: "❌ Este comando só pode ser usado em um servidor.",
            ephemeral: true,
        });
        return false;
    }
    return true;
}
/**
 * Verifica se o usuário tem permissão de administrador.
 * @param interaction - A interação do comando.
 * @returns `true` se o usuário for administrador, caso contrário responde ao usuário e retorna `false`.
 */
export function ensureAdmin(interaction) {
    const member = interaction.member;
    if (!member || !('permissions' in member) || !(member.permissions instanceof PermissionsBitField) || !member.permissions.has(PermissionFlagsBits.Administrator)) {
        interaction.reply({
            content: "❌ Você não tem permissão para usar este comando.",
            ephemeral: true,
        });
        return false;
    }
    return true;
}
/**
 * Verifica se a interação é em um servidor.
 * @param interaction - A interação do comando.
 * @returns `true` se a interação for em um servidor, caso contrário `false`.
 */
export function isInGuild(interaction) {
    return !!interaction.guild;
}
/**
 * Verifica se o usuário tem permissão de administrador.
 * @param interaction - A interação do comando.
 * @returns `true` se o usuário for administrador, caso contrário `false`.
 */
export function hasAdminPermissions(interaction) {
    const member = interaction.member;
    return member?.permissions?.has('ADMINISTRATOR') ?? false;
}
/**
 * Verifica se o usuário tem um Riot ID vinculado.
 * @param discordId - O ID do usuário no Discord.
 * @param db - O banco de dados.
 * @returns `true` se o usuário tiver um Riot ID vinculado, caso contrário `false`.
 */
export function hasLinkedRiotId(discordId, db) {
    const user = db.data?.users.find((u) => u.discordId === discordId);
    return !!user?.riotId;
}
//# sourceMappingURL=security.js.map