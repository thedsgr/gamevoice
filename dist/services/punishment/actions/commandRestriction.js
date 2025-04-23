import { GuildMember } from 'discord.js';
import { db } from '@utils/db.js';
import { Logger } from '@utils/log.js';
/**
 * Aplica uma restrição de comandos a um membro.
 * @param target - O membro alvo da restrição.
 * @param duration - A duração da restrição em milissegundos.
 * @param reason - O motivo da restrição.
 * @param client - O cliente do bot (opcional, para registro de logs).
 * @returns Um objeto indicando o sucesso ou falha da operação.
 */
export async function applyCommandRestriction(target, duration, reason, client) {
    try {
        // Validações básicas
        if (!target || !(target instanceof GuildMember)) {
            throw new Error('O membro alvo não é válido.');
        }
        if (typeof duration !== 'number' || duration <= 0) {
            throw new Error('A duração deve ser um número maior que zero.');
        }
        // Atualiza o banco de dados para adicionar ou atualizar a restrição
        await db.update((data) => {
            const restrictedUsers = data.restrictedUsers || [];
            const existing = restrictedUsers.find((u) => u.userId === target.id);
            if (existing) {
                existing.until = Date.now() + duration;
                existing.reason = reason || existing.reason;
            }
            else {
                restrictedUsers.push({
                    userId: target.id,
                    until: Date.now() + duration,
                    reason,
                });
            }
            return { restrictedUsers }; // Ensure the updated data is returned
        });
        // Registrar no sistema de logs
        if (client) {
            const logger = new Logger();
            await logger.log(`Usuário ${target.displayName} foi restrito de comandos. Motivo: ${reason || 'Não especificado'}. Duração: ${formatDuration(duration)}`, 'COMMAND_RESTRICT');
        }
        return {
            success: true,
            message: `🚫 ${target.displayName} restrito de comandos por ${formatDuration(duration)}`,
            duration,
        };
    }
    catch (error) {
        console.error('❌ Erro ao aplicar restrição de comandos:', error);
        return {
            success: false,
            message: `❌ Falha ao restringir ${target?.displayName || 'usuário desconhecido'}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        };
    }
}
/**
 * Formata a duração em milissegundos para uma string legível.
 * @param ms - A duração em milissegundos.
 * @returns Uma string formatada indicando a duração em dias, horas, minutos e segundos.
 */
function formatDuration(ms) {
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
