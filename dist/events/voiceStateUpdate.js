import { db } from '../utils/db';
const deletionTimeouts = new Map();
export default async function handleVoiceStateUpdate(oldState, newState) {
    const activeChannelId = db.data?.activeVoiceChannel;
    const waitingRoomChannelId = db.data?.waitingRoomChannelId;
    // ✅ Move quem entrar na sala de espera
    if (newState.channelId === waitingRoomChannelId) {
        const member = newState.member;
        const guild = newState.guild;
        const targetChannel = guild.channels.cache.get(activeChannelId);
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
    if (oldState.channelId === activeChannelId) {
        const channel = oldState.guild.channels.cache.get(activeChannelId);
        if (channel && channel.members.size === 0) {
            if (!deletionTimeouts.has(channel.id)) {
                const timeout = setTimeout(async () => {
                    try {
                        await channel.delete();
                        console.log(`🗑️ Canal de voz ${channel.name} excluído por inatividade.`);
                        if (db.data) {
                            db.data.activeVoiceChannel = undefined;
                            await db.write();
                        }
                    }
                    catch (err) {
                        console.error("❌ Erro ao excluir canal de voz:", err);
                    }
                    deletionTimeouts.delete(channel.id);
                }, 60_000); // 1 minuto
                deletionTimeouts.set(channel.id, timeout);
                console.log(`⏳ Canal ${channel.name} será excluído em 1 minuto se permanecer vazio.`);
            }
        }
    }
    // 🛑 Se alguém entrou no canal da partida, cancela a exclusão
    if (newState.channelId === activeChannelId) {
        const channel = newState.guild.channels.cache.get(activeChannelId);
        const timeout = deletionTimeouts.get(channel.id);
        if (timeout) {
            clearTimeout(timeout);
            deletionTimeouts.delete(channel.id);
            console.log(`❌ Cancelada exclusão do canal ${channel.name}, alguém entrou.`);
        }
    }
}
//# sourceMappingURL=voiceStateUpdate.js.map