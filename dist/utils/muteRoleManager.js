/**
 * Este arquivo implementa a classe `MuteRoleManager`, responsável por gerenciar o cargo "Muted" em servidores Discord.
 * Ele permite criar ou encontrar o cargo "Muted", aplicá-lo a membros, remover o cargo e verificar se um membro está mutado.
 *
 * Funcionalidades principais:
 * - Criar ou encontrar o cargo "Muted" em um servidor.
 * - Configurar permissões do cargo "Muted" em todos os canais do servidor.
 * - Adicionar ou remover o cargo "Muted" de membros.
 * - Aplicar ou remover mute em canais de voz.
 * - Registrar logs de ações relacionadas ao silenciamento.
 */
import { ChannelType } from 'discord.js';
import { Logger, sendLog } from './log.js';
const MUTE_ROLE_NAME = 'Muted';
const MUTE_ROLE_COLOR = '#ff0000';
const MUTE_ROLE_PERMISSIONS = {
    SendMessages: false,
    Speak: false,
    AddReactions: false,
    Stream: false,
    SendMessagesInThreads: false,
    Connect: true,
    ViewChannel: true,
};
export class MuteRoleManager {
    /**
     * Cria o cargo "Muted" no servidor.
     * @param guild - O servidor onde o cargo será criado.
     * @returns O cargo criado.
     */
    static async createMuteRole(guild) {
        const muteRole = await guild.roles.create({
            name: MUTE_ROLE_NAME,
            color: MUTE_ROLE_COLOR,
            reason: 'Cargo para usuários silenciados',
            permissions: [],
            hoist: false,
        });
        Logger.info(`Cargo "${MUTE_ROLE_NAME}" criado no servidor ${guild.name}.`);
        return muteRole;
    }
    /**
     * Configura as permissões do cargo "Muted" em todos os canais do servidor.
     * @param guild - O servidor onde as permissões serão configuradas.
     * @param muteRole - O cargo "Muted".
     */
    static async configureMuteRolePermissions(guild, muteRole) {
        for (const channel of guild.channels.cache.values()) {
            try {
                if (channel.type === ChannelType.GuildText ||
                    channel.type === ChannelType.GuildVoice ||
                    channel.type === ChannelType.GuildNews ||
                    channel.type === ChannelType.GuildStageVoice) {
                    const existingPermissions = channel.permissionOverwrites.cache.get(muteRole.id);
                    if (!existingPermissions) {
                        await channel.permissionOverwrites.create(muteRole, MUTE_ROLE_PERMISSIONS);
                    }
                }
            }
            catch (error) {
                Logger.error(`Erro ao configurar permissões para o canal ${channel.name}:`, error);
            }
        }
    }
    /**
     * Encontra ou cria o cargo "Muted" no servidor.
     * @param guild - O servidor onde o cargo será encontrado ou criado.
     * @returns O cargo "Muted".
     */
    static async findOrCreateMuteRole(guild) {
        let muteRole = guild.roles.cache.find(r => r.name === MUTE_ROLE_NAME);
        if (!muteRole) {
            muteRole = await this.createMuteRole(guild);
            await this.configureMuteRolePermissions(guild, muteRole);
        }
        return muteRole;
    }
    /**
     * Adiciona o cargo "Muted" a um membro.
     * @param member - O membro que será silenciado.
     * @param reason - O motivo do silenciamento.
     * @param client - O cliente do bot (opcional, para logs).
     * @returns `true` se o silenciamento foi bem-sucedido, caso contrário `false`.
     */
    static async addMuteRole(member, reason, client) {
        try {
            if (this.isMuted(member)) {
                return true;
            }
            const muteRole = await this.findOrCreateMuteRole(member.guild);
            await member.roles.add(muteRole);
            if (member.voice.channel) {
                await member.voice.setMute(true, reason || 'Mute por comportamento inadequado');
            }
            if (client) {
                Logger.info(`Usuário silenciado: ${member.user.tag}`, {
                    type: 'VOICE_MUTE',
                    user: member.user.tag,
                    reason: reason || 'Nenhum motivo especificado',
                });
                await sendLog(client, `🔇 Usuário silenciado: ${member.user.tag} | Motivo: ${reason || 'Nenhum motivo especificado'}`, 'MOD');
            }
            Logger.success(`🔇 ${member.user.tag} foi silenciado.`);
            return true;
        }
        catch (error) {
            Logger.error('❌ Erro ao adicionar o cargo de silenciado:', error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }
    /**
     * Remove o cargo "Muted" de um membro.
     * @param member - O membro que será desmutado.
     * @param client - O cliente do bot (opcional, para logs).
     * @returns `true` se o desmute foi bem-sucedido, caso contrário `false`.
     */
    static async removeMuteRole(member, client) {
        try {
            const muteRole = member.roles.cache.find(r => r.name === MUTE_ROLE_NAME);
            if (muteRole) {
                await member.roles.remove(muteRole);
                if (member.voice.channel) {
                    await member.voice.setMute(false, 'Mute removido');
                }
                if (client) {
                    Logger.info(`Silenciamento removido: ${member.user.tag}`, {
                        type: 'VOICE_UNMUTE',
                        user: member.user.tag,
                        reason: 'Silenciamento removido',
                    });
                    await sendLog(client, `🔊 Silenciamento removido: ${member.user.tag}`, 'MOD');
                }
                Logger.success(`🔊 ${member.user.tag} teve o silenciamento removido.`);
            }
            return true;
        }
        catch (error) {
            Logger.error('❌ Erro ao remover o cargo de silenciado:', error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }
    /**
     * Verifica se um membro está silenciado.
     * @param member - O membro a ser verificado.
     * @returns `true` se o membro está silenciado, caso contrário `false`.
     */
    static isMuted(member) {
        return member.roles.cache.some(r => r.name === MUTE_ROLE_NAME);
    }
}
