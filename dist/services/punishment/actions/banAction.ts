import { GuildMember } from 'discord.js';
import { PunishmentResult } from '../types/punishmentTypes.js';
import { Logger } from '@utils/log.js';

export async function applyBan(
  target: GuildMember,
  reason?: string
): Promise<PunishmentResult> {
  try {
    await target.ban({ 
      reason: `Banimento permanente: ${reason || 'Infração grave'}`,
      deleteMessageDays: 7 // Apaga mensagens dos últimos 7 dias
    });

    const logger = new Logger();
    await logger.log(
      `Usuário ${target.displayName} foi banido. Motivo: ${reason || 'Infração grave'}`,
      'BAN'
    );

    return {
      success: true,
      message: `🔨 ${target.displayName} foi banido permanentemente`,
      duration: -1
    };
  } catch (error) {
    console.error('Ban error:', error);
    return {
      success: false,
      message: `❌ Falha ao banir ${target.displayName}`
    };
  }
}