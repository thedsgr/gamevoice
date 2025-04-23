import { Client, GuildMember } from 'discord.js';
import { MuteRoleManager } from '../../../utils/muteRoleManager.js';
import { PunishmentResult } from '../types/punishmentTypes.js';
import { Logger } from '../../../utils/log.js';

// Helper function to format duration in a human-readable way
function formatDuration(duration: number): string {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));

  return [
    days > 0 ? `${days}d` : '',
    hours > 0 ? `${hours}h` : '',
    minutes > 0 ? `${minutes}m` : '',
    seconds > 0 ? `${seconds}s` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export async function applyVoiceMute(
  target: GuildMember,
  duration: number,
  reason?: string,
  client?: Client
): Promise<PunishmentResult> {
  try {
    // 1. Aplicar cargo de mute
    const roleAdded = await MuteRoleManager.addMuteRole(target);
    if (!roleAdded) throw new Error('Failed to add mute role');

    // 2. Mute no canal de voz (se estiver em um)
    if (target.voice.channel) {
      await target.voice.setMute(true, reason);
    }

    // 3. Registrar timeout para remoção automática
    const timeout = setTimeout(async () => {
      await MuteRoleManager.removeMuteRole(target);
      if (target.voice.channel) {
        await target.voice.setMute(false, 'Mute automático expirado');
      }
    }, duration);

    // 4. Registrar no sistema de logs
    if (client) {
      const logger = new Logger();
      logger.log(
        `Usuário ${target.displayName} foi mutado. Motivo: ${reason || 'Não especificado'}. Duração: ${formatDuration(duration)}`,
        'VOICE_MUTE'
      );
    }

    return {
      success: true,
      message: `🔇 ${target.displayName} mutado por ${formatDuration(duration)}`,
      duration
    };
  } catch (error) {
    console.error('❌ Erro ao aplicar mute de voz:', error);
    return {
      success: false,
      message: 'Erro ao aplicar mute de voz.',
    };
  }
}