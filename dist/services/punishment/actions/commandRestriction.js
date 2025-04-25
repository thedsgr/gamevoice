/**
 * Este arquivo implementa a lógica para aplicar restrições de uso de comandos a usuários no servidor Discord.
 * Ele permite adicionar ou atualizar restrições no banco de dados, especificando a duração e o motivo.
 * Além disso, registra logs das ações realizadas e retorna o resultado da operação.
 *
 * Funcionalidades principais:
 * - Adicionar ou atualizar restrições de comandos para usuários.
 * - Registrar logs detalhados sobre as restrições aplicadas.
 * - Retornar o resultado da operação de restrição.
 */
import { GuildMember } from 'discord.js';
import { db, ensureDBInitialized } from '../../../utils/db.js';
import { Logger } from '../../../utils/log.js';
import { formatDuration } from '../../../utils/formatters.js';
/**
 * Remove restrições expiradas do banco de dados.
 */
function cleanExpiredRestrictions() {
    ensureDBInitialized();
    const now = Date.now();
    db.data.restrictedUsers = db.data.restrictedUsers.filter((u) => u.until > now);
    db.write();
}
/**
 * Verifica se um usuário está restrito de usar comandos.
 * @param userId - O ID do usuário a ser verificado.
 * @returns `true` se o usuário estiver restrito, caso contrário `false`.
 */
export function isUserRestricted(userId) {
    ensureDBInitialized();
    cleanExpiredRestrictions();
    const restrictedUser = db.data?.restrictedUsers.find((u) => u.userId === userId);
    return restrictedUser ? restrictedUser.until > Date.now() : false;
}
/**
 * Adiciona ou atualiza um usuário restrito no banco de dados.
 * @param userId - O ID do usuário a ser restrito.
 * @param duration - A duração da restrição em milissegundos.
 * @param reason - O motivo da restrição (opcional).
 */
async function upsertRestrictedUser(userId, duration, reason) {
    ensureDBInitialized();
    const restrictedUsers = db.data?.restrictedUsers || [];
    const existing = restrictedUsers.find((u) => u.userId === userId);
    if (existing && existing.until > Date.now()) {
        throw new Error('O usuário já está restrito de comandos.');
    }
    if (existing) {
        existing.until = Date.now() + duration;
        existing.reason = reason || existing.reason;
    }
    else {
        restrictedUsers.push({
            userId,
            until: Date.now() + duration,
            reason,
        });
    }
    db.data.restrictedUsers = restrictedUsers;
    await db.write();
}
/**
 * Aplica uma restrição de comandos a um membro do servidor.
 * @param target - O membro alvo da restrição.
 * @param duration - A duração da restrição em milissegundos.
 * @param reason - O motivo da restrição (opcional).
 * @param client - O cliente do bot (opcional, usado para logs).
 * @returns Um objeto indicando o sucesso ou falha da operação.
 */
export async function applyCommandRestriction(target, duration, reason, client) {
    try {
        // Validações
        if (!target || !(target instanceof GuildMember)) {
            throw new Error('O membro alvo não é válido.');
        }
        if (typeof duration !== 'number' || duration <= 0) {
            throw new Error('A duração deve ser um número maior que zero.');
        }
        // Adiciona ou atualiza a restrição no banco de dados
        await upsertRestrictedUser(target.id, duration, reason);
        // Loga a ação, se o cliente estiver disponível
        if (client) {
            Logger.info(`Usuário ${target.displayName} foi restrito de comandos. Motivo: ${reason || 'Não especificado'}. Duração: ${formatDuration(duration)}`);
        }
        return {
            success: true,
            message: `🚫 ${target.displayName} restrito de comandos por ${formatDuration(duration)}`,
            duration,
        };
    }
    catch (error) {
        Logger.error('❌ Erro ao aplicar restrição de comandos:', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            message: `❌ Falha ao restringir ${target?.displayName || 'usuário desconhecido'}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        };
    }
}
