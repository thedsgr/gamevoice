import { Guild, GuildMember, Role, ChannelType, PermissionFlagsBits, Client } from 'discord.js';
import { Logger, sendLog } from './log.js';

export class MuteRoleManager {
  private static async findOrCreateMuteRole(guild: Guild): Promise<Role> {
    let muteRole = guild.roles.cache.find(r => r.name === 'Muted');
    
    if (!muteRole) {
      muteRole = await guild.roles.create({
        name: 'Muted',
        color: '#ff0000',
        reason: 'Cargo para usuários silenciados',
        permissions: [],
        hoist: false
      });

      // Permissões padrão para o cargo
      await muteRole.setPermissions([]);

      // Aplicar permissões em todos os canais
      for (const channel of guild.channels.cache.values()) {
        try {
          if (
            channel.type === ChannelType.GuildText ||
            channel.type === ChannelType.GuildVoice ||
            channel.type === ChannelType.GuildNews ||
            channel.type === ChannelType.GuildStageVoice
          ) {
            await channel.permissionOverwrites.create(muteRole, {
              SendMessages: false,
              Speak: false,
              AddReactions: false,
              Stream: false,
              SendMessagesInThreads: false,
              Connect: true, // Permite conectar, mas não falar
              ViewChannel: true // Permite ver o canal
            });
          }
        } catch (error) {
          Logger.error(`Erro ao configurar permissões para ${channel.name}:`, error as Error);
        }
      }
    }

    return muteRole;
  }

  static async addMuteRole(member: GuildMember, reason?: string, client?: Client): Promise<boolean> {
    try {
      // Verificar se já está mutado
      if (this.isMuted(member)) {
        return true;
      }

      const muteRole = await this.findOrCreateMuteRole(member.guild);
      await member.roles.add(muteRole);

      // Se estiver em um canal de voz, aplicar mute
      if (member.voice.channel) {
        await member.voice.setMute(true, reason || 'Mute por comportamento inadequado');
      }

      // Registrar no sistema de logs
      if (client) {
        Logger.info(`Usuário silenciado: ${member.user.tag}`, {
          type: 'VOICE_MUTE',
          user: member.user.tag,
          reason: reason || 'Nenhum motivo especificado'
        });

        await sendLog(
          client,
          `🔇 Usuário silenciado: ${member.user.tag} | Motivo: ${reason || 'Nenhum motivo especificado'}`,
          'MOD'
        );
      }

      Logger.success(`🔇 ${member.user.tag} foi silenciado.`);
      return true;
    } catch (error) {
      Logger.error('❌ Erro ao adicionar o cargo de silenciado:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  static async removeMuteRole(member: GuildMember, client?: Client): Promise<boolean> {
    try {
      const muteRole = member.roles.cache.find(r => r.name === 'Muted');
      if (muteRole) {
        await member.roles.remove(muteRole);
        
        // Remover mute do canal de voz se estiver em um
        if (member.voice.channel) {
          await member.voice.setMute(false, 'Mute removido');
        }

        // Registrar no sistema de logs
        if (client) {
          Logger.info(`Silenciamento removido: ${member.user.tag}`, {
            type: 'VOICE_UNMUTE',
            user: member.user.tag,
            reason: 'Silenciamento removido'
          });

          await sendLog(
            client,
            `🔊 Silenciamento removido: ${member.user.tag}`,
            'MOD'
          );
        }

        Logger.success(`🔊 ${member.user.tag} teve o silenciamento removido.`);
      }
      return true;
    } catch (error) {
      Logger.error('❌ Erro ao remover o cargo de silenciado:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  static isMuted(member: GuildMember): boolean {
    return member.roles.cache.some(r => r.name === 'Muted');
  }
}