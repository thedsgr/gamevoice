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

import { Client, GuildMember } from 'discord.js';
import { PunishmentResult } from '../types/punishmentTypes.js';
import db from '../../../utils/db.js';
import { Logger } from '../../../utils/log.js';
import { formatDuration } from '../../../utils/formatters.js';

/**
 * Remove restrições expiradas do banco de dados.
 * @throws Lança um erro se a operação no banco de dados falhar.
 */
async function cleanExpiredRestrictions() {
    try {
        const now = Date.now();
        await db('restrictedUsers').where('until', '<', now).del();
    } catch (error) {
        Logger.error('Erro ao limpar restrições expiradas:', error instanceof Error ? error : new Error(String(error)));
        throw new Error('Não foi possível limpar as restrições expiradas.');
    }
}

/**
 * Verifica se um usuário está restrito de usar comandos.
 * @param userId - O ID do usuário a ser verificado.
 * @returns `true` se o usuário estiver restrito, caso contrário `false`.
 * @throws Lança um erro se a operação no banco de dados falhar.
 */
export async function isUserRestricted(userId: string): Promise<boolean> {
    try {
        const restrictedUser = await db('restrictedUsers').where({ userId }).first();
        return !!restrictedUser && restrictedUser.until > Date.now();
    } catch (error) {
        Logger.error(`Erro ao verificar restrição para o usuário ${userId}:`, error instanceof Error ? error : new Error(String(error)));
        throw new Error('Não foi possível verificar a restrição do usuário.');
    }
}

/**
 * Adiciona ou atualiza um usuário restrito no banco de dados.
 * @param userId - O ID do usuário a ser restrito.
 * @param duration - A duração da restrição em milissegundos.
 * @param reason - O motivo da restrição (opcional).
 * @throws Lança um erro se os parâmetros forem inválidos ou a operação no banco de dados falhar.
 */
async function upsertRestrictedUser(userId: string, duration: number, reason?: string) {
    if (!userId || typeof userId !== 'string') {
        throw new Error('O ID do usuário é inválido.');
    }
    if (typeof duration !== 'number' || duration <= 0) {
        throw new Error('A duração deve ser um número maior que zero.');
    }

    try {
        const now = Date.now();
        const existing = await db('restrictedUsers').where({ userId }).first();

        if (existing) {
            await db('restrictedUsers').where({ userId }).update({
                until: now + duration,
                reason: reason || existing.reason,
            });
        } else {
            await db('restrictedUsers').insert({
                userId,
                until: now + duration,
                reason,
            });
        }
    } catch (error) {
        Logger.error(`Erro ao adicionar ou atualizar restrição para o usuário ${userId}:`, error instanceof Error ? error : new Error(String(error)));
        throw new Error('Não foi possível adicionar ou atualizar a restrição do usuário.');
    }
}

/**
 * Aplica uma restrição de comandos a um membro do servidor.
 * @param target - O membro alvo da restrição.
 * @param duration - A duração da restrição em milissegundos.
 * @param reason - O motivo da restrição (opcional).
 * @param client - O cliente do bot (opcional, usado para logs).
 * @returns Um objeto indicando o sucesso ou falha da operação.
 */
export async function applyCommandRestriction(
    target: GuildMember,
    duration: number,
    reason?: string,
    client?: Client
): Promise<PunishmentResult> {
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
            Logger.info(
                `Usuário ${target.displayName} foi restrito de comandos. Motivo: ${reason || 'Não especificado'}. Duração: ${formatDuration(duration)}`
            );
        }

        return {
            success: true,
            message: `🚫 ${target.displayName} restrito de comandos por ${formatDuration(duration)}`,
            duration,
        };
    } catch (error) {
        Logger.error('❌ Erro ao aplicar restrição de comandos:', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            message: `❌ Falha ao restringir ${target?.displayName || 'usuário desconhecido'}: ${
                error instanceof Error ? error.message : 'Erro desconhecido'
            }`,
        };
    }
}