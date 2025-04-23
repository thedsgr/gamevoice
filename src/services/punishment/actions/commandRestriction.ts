import { Client, GuildMember } from 'discord.js';
import { PunishmentResult } from '../types/punishmentTypes.js';
import { db, ensureDBInitialized } from '../../../utils/db.js';
import { Logger } from '../../../utils/log.js';
import { formatDuration } from '../../../utils/formatters.js';

/** Adiciona ou atualiza um usuário restrito no banco de dados */
async function upsertRestrictedUser(userId: string, duration: number, reason?: string) {
  ensureDBInitialized();

  const restrictedUsers = db.data!.restrictedUsers || [];
  const existing = restrictedUsers.find((u) => u.userId === userId);

  if (existing) {
    existing.until = Date.now() + duration;
    existing.reason = reason || existing.reason;
  } else {
    restrictedUsers.push({
      userId,
      until: Date.now() + duration,
      reason,
    });
  }

  db.data!.restrictedUsers = restrictedUsers;
  await db.write();
}

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
      const logger = new Logger();
      await logger.log(
        `Usuário ${target.displayName} foi restrito de comandos. Motivo: ${reason || 'Não especificado'}. Duração: ${formatDuration(duration)}`,
        'COMMAND_RESTRICT'
      );
    }

    return {
      success: true,
      message: `🚫 ${target.displayName} restrito de comandos por ${formatDuration(duration)}`,
      duration,
    };
  } catch (error) {
    console.error('❌ Erro ao aplicar restrição de comandos:', error);
    return {
      success: false,
      message: `❌ Falha ao restringir ${target?.displayName || 'usuário desconhecido'}: ${
        error instanceof Error ? error.message : 'Erro desconhecido'
      }`,
    };
  }
}