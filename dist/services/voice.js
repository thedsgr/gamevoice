import { ChannelType } from 'discord.js';
import { db } from '../utils/db.js';
/**
 * Cria um canal de voz para o membro especificado.
 * @param guild - O servidor onde o canal será criado.
 * @param member - O membro que será o dono do canal.
 * @returns O canal de voz criado.
 */
export async function createVoiceChannel(guild, member) {
    return guild.channels.create({
        name: `Partida do Time ${member.displayName}`,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: ['Connect'] },
            { id: member.id, allow: ['Connect', 'ViewChannel'] },
        ],
    });
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
    return guild.channels.create({
        name: "Sala de Espera",
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
            { id: guild.roles.everyone.id, allow: ['Connect', 'ViewChannel'] },
        ],
    });
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
//# sourceMappingURL=voice.js.map