import { ChannelType } from 'discord.js';
import { db } from '../utils/db.js';
/**
 * Cria um canal de voz genérico.
 * @param guild - O servidor onde o canal será criado.
 * @param name - O nome do canal.
 * @param permissions - As permissões do canal.
 * @returns O canal de voz criado.
 */
async function createGenericVoiceChannel(guild, name, permissions) {
    return guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        permissionOverwrites: permissions,
    });
}
/**
 * Cria um canal de voz para o membro especificado.
 * @param guild - O servidor onde o canal será criado.
 * @param member - O membro que será o dono do canal.
 * @returns O canal de voz criado.
 */
export async function createVoiceChannel(guild, member) {
    return createGenericVoiceChannel(guild, `Partida do Time ${member.displayName}`, [
        { id: guild.roles.everyone.id, deny: ['Connect'] },
        { id: member.id, allow: ['Connect', 'ViewChannel'] },
    ]);
}
/**
 * Atualiza o ID do canal de voz ativo no banco de dados.
 * @param channelId - O ID do canal de voz ativo.
 */
export async function updateActiveVoiceChannel(channelId) {
    if (db.data) {
        db.data.activeVoiceChannel = channelId;
        await db.write();
    }
}
/**
 * Obtém o canal de voz ativo ou cria um novo, se necessário.
 * @param guild - O servidor onde o canal será criado ou buscado.
 * @param member - O membro que será o dono do canal.
 * @returns O canal de voz ativo ou recém-criado.
 */
export async function getOrCreateVoiceChannel(guild, member) {
    const activeChannelId = db.data?.activeVoiceChannel;
    let voiceChannel;
    if (activeChannelId) {
        voiceChannel = guild.channels.cache.get(activeChannelId);
        if (!voiceChannel) {
            voiceChannel = await createVoiceChannel(guild, member);
            await updateActiveVoiceChannel(voiceChannel.id);
        }
    }
    else {
        voiceChannel = await createVoiceChannel(guild, member);
        await updateActiveVoiceChannel(voiceChannel.id);
    }
    return voiceChannel;
}
/**
 * Cria ou obtém a sala de espera.
 * @param guild - O servidor onde a sala será criada ou buscada.
 * @returns A sala de espera.
 */
export async function getOrCreateWaitingRoomChannel(guild) {
    const waitingRoomChannelId = db.data?.waitingRoomChannelId;
    let waitingRoomChannel;
    if (waitingRoomChannelId) {
        waitingRoomChannel = guild.channels.cache.get(waitingRoomChannelId);
        if (!waitingRoomChannel) {
            waitingRoomChannel = await createWaitingRoomChannel(guild);
            await updateWaitingRoomChannel(waitingRoomChannel.id);
        }
    }
    else {
        waitingRoomChannel = await createWaitingRoomChannel(guild);
        await updateWaitingRoomChannel(waitingRoomChannel.id);
    }
    return waitingRoomChannel;
}
/**
 * Cria a sala de espera.
 * @param guild - O servidor onde a sala será criada.
 * @returns A sala de espera criada.
 */
export async function createWaitingRoomChannel(guild) {
    return createGenericVoiceChannel(guild, "Sala de Espera", [
        { id: guild.roles.everyone.id, allow: ['Connect', 'ViewChannel'] },
    ]);
}
/**
 * Atualiza o ID da sala de espera no banco de dados.
 * @param channelId - O ID da sala de espera.
 */
export async function updateWaitingRoomChannel(channelId) {
    if (db.data) {
        db.data.waitingRoomChannelId = channelId;
        await db.write();
    }
}
/**
 * Monitora canais de voz vazios e realiza ações, como exclusão automática.
 * @param client - O cliente do bot.
 */
export function monitorEmptyChannels(client) {
    const CHECK_INTERVAL = 60000; // 1 minuto
    setInterval(() => {
        client.guilds.cache.forEach((guild) => {
            const voiceChannels = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildVoice);
            voiceChannels.forEach((channel) => {
                const voiceChannel = channel;
                if (voiceChannel.members.size === 0) {
                    console.log(`🔇 Canal de voz vazio detectado: ${voiceChannel.name} (ID: ${voiceChannel.id}) no servidor ${guild.name}`);
                    // Exemplo: Excluir o canal vazio (opcional)
                    // voiceChannel.delete().catch(console.error);
                }
            });
        });
    }, CHECK_INTERVAL);
}
/**
 * Limpa canais de voz órfãos que não estão mais associados a partidas ativas.
 * @param guild - O servidor onde os canais serão verificados.
 */
export async function cleanupOrphanedChannels(guild) {
    const dbChannels = db.data?.matches.filter(m => m.isActive).map(m => m.channelId) || [];
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice &&
        c.name.startsWith('Partida do Time') &&
        !dbChannels.includes(c.id));
    for (const [_, channel] of voiceChannels) {
        try {
            await channel.delete('Limpeza de canais órfãos');
            console.log(`🗑️ Canal órfão deletado: ${channel.name}`);
        }
        catch (error) {
            console.error(`❌ Erro ao deletar canal ${channel.name}:`, error);
        }
    }
}
