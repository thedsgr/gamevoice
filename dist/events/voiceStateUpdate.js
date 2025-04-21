import { db } from '../utils/db.js';
// Removed duplicate import of voiceStateUpdateHandler
import { ExtendedClient } from "../structs/ExtendedClient.js";
const deletionTimeouts = new Map();
const EMPTY_CHANNEL_TIMEOUT = 60 * 1000; // 1 minuto
export default async function handleVoiceStateUpdate(oldState, newState) {
    const activeMatches = db.data?.matches || [];
    // ✅ Move quem entrar na sala de espera
    const waitingRoomChannelId = db.data?.waitingRoomChannelId;
    if (newState.channelId === waitingRoomChannelId) {
        const member = newState.member;
        const guild = newState.guild;
        const activeMatch = activeMatches.find(match => match.isActive);
        const targetChannel = activeMatch
            ? guild.channels.cache.get(activeMatch.channelId)
            : null;
        if (targetChannel && member) {
            try {
                await member.voice.setChannel(targetChannel);
                console.log(`✅ ${member.user.tag} movido para ${targetChannel.name}`);
            }
            catch (err) {
                console.error(`❌ Erro ao mover ${member.user.tag}:`, err);
            }
        }
    }
    // ⏳ Se o canal da partida ficou vazio, agenda deleção
    if (oldState.channelId) {
        const channel = oldState.guild.channels.cache.get(oldState.channelId);
        if (channel && channel.members.size === 0) {
            scheduleChannelDeletion(channel);
        }
    }
    // 🛑 Se alguém entrou no canal da partida, cancela a exclusão
    if (newState.channelId) {
        const channel = newState.guild.channels.cache.get(newState.channelId);
        if (channel) {
            cancelChannelDeletion(channel);
        }
    }
}
/**
 * Agenda a exclusão de um canal vazio após o timeout.
 */
function scheduleChannelDeletion(channel) {
    if (!deletionTimeouts.has(channel.id)) {
        const timeout = setTimeout(async () => {
            try {
                await channel.delete();
                console.log(`🗑️ Canal de voz ${channel.name} excluído por inatividade.`);
                const match = db.data?.matches.find(match => match.channelId === channel.id);
                if (match) {
                    match.isActive = false;
                    db.data.stats.totalMatchesEndedByInactivity++;
                    await db.write();
                }
            }
            catch (err) {
                console.error("❌ Erro ao excluir canal de voz:", err);
            }
            deletionTimeouts.delete(channel.id);
        }, EMPTY_CHANNEL_TIMEOUT);
        deletionTimeouts.set(channel.id, timeout);
        console.log(`⏳ Canal ${channel.name} será excluído em 1 minuto se permanecer vazio.`);
    }
}
/**
 * Cancela a exclusão de um canal se ele não estiver mais vazio.
 */
function cancelChannelDeletion(channel) {
    const timeout = deletionTimeouts.get(channel.id);
    if (timeout) {
        clearTimeout(timeout);
        deletionTimeouts.delete(channel.id);
        console.log(`❌ Cancelada exclusão do canal ${channel.name}, alguém entrou.`);
    }
}
export async function voiceStateUpdate(oldState, newState) {
    const channel = oldState.channel || newState.channel;
    if (!channel)
        return;
    // Atualiza o timestamp de última atividade no banco de dados
    const match = db.data?.matches.find(match => match.channelId === channel.id);
    if (match) {
        match.lastActivity = Date.now();
        await db.write();
    }
}
export function monitorEmptyChannels(client) {
    setInterval(async () => {
        const now = Date.now();
        // Itera sobre os canais de voz ativos no banco de dados
        const activeMatches = db.data?.matches.filter(match => match.isActive) || [];
        for (const match of activeMatches) {
            const channel = client.channels.cache.get(match.channelId);
            // Verifica se o canal está vazio
            if (channel && channel.members.size === 0) {
                const timeSinceLastActivity = now - (match.lastActivity || now);
                if (timeSinceLastActivity >= EMPTY_CHANNEL_TIMEOUT) {
                    // Exclui o canal e atualiza o banco de dados
                    await channel.delete().catch(console.error);
                    match.isActive = false;
                    db.data.stats.totalMatchesEndedByInactivity++;
                    await db.write();
                    console.log(`🗑️ Canal ${channel.name} excluído por inatividade.`);
                }
            }
        }
    }, 10 * 1000); // Verifica a cada 10 segundos
}
import voiceStateUpdateHandler from './voiceStateUpdate.js';
const client = new ExtendedClient({ intents: [] }); // Adicione os intents necessários
client.on('voiceStateUpdate', voiceStateUpdateHandler);
//# sourceMappingURL=voiceStateUpdate.js.map