import { VoiceState, VoiceChannel, Client } from 'discord.js';
import { db } from '../utils/db.js';
import { ExtendedClient } from '../structs/ExtendedClient.js';

const deletionTimeouts = new Map<string, NodeJS.Timeout>();
const EMPTY_CHANNEL_TIMEOUT = 60 * 1000; // 1 minuto

/**
 * Manipula o evento de atualização de estado de voz.
 */
export async function handleVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState,
  client: ExtendedClient
): Promise<void> {
  const waitingRoomId = process.env.WAITING_ROOM_ID;

  // Valida se a variável de ambiente está definida
  if (!waitingRoomId) {
    console.error('❌ WAITING_ROOM_ID não está definido.');
    return;
  }

  const activeMatches = db.data?.matches || [];

  // ✅ Move quem entrar na sala de espera
  if (newState.channelId === waitingRoomId) {
    const member = newState.member;
    const guild = newState.guild;
    const activeMatch = activeMatches.find(match => match.isActive);
    const targetChannel = activeMatch
      ? guild.channels.cache.get(activeMatch.channelId) as VoiceChannel
      : null;

    if (targetChannel && member) {
      try {
        await member.voice.setChannel(targetChannel);
        console.log(`✅ ${member.user.tag} movido para ${targetChannel.name}`);
      } catch (err) {
        console.error(`❌ Erro ao mover ${member.user.tag}:`, err);
      }
    }
  }

  // ⏳ Se o canal da partida ficou vazio, agenda deleção
  if (oldState.channelId) {
    const channel = oldState.guild.channels.cache.get(oldState.channelId) as VoiceChannel;
    if (channel && channel.members.size === 0) {
      scheduleChannelDeletion(channel);
    }
  }

  // 🛑 Se alguém entrou no canal da partida, cancela a exclusão
  if (newState.channelId) {
    const channel = newState.guild.channels.cache.get(newState.channelId) as VoiceChannel;
    if (channel) {
      cancelChannelDeletion(channel);
    }
  }
}

/**
 * Agenda a exclusão de um canal vazio após o timeout.
 */
function scheduleChannelDeletion(channel: VoiceChannel): void {
  if (!deletionTimeouts.has(channel.id)) {
    const timeout = setTimeout(async () => {
      try {
        await channel.delete();
        console.log(`🗑️ Canal de voz ${channel.name} excluído por inatividade.`);
        const match = db.data?.matches.find(match => match.channelId === channel.id);
        if (match) {
          match.isActive = false;
          db.data!.stats.totalMatchesEndedByInactivity++;
          await db.write();
        }
      } catch (err) {
        console.error('❌ Erro ao excluir canal de voz:', err);
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
function cancelChannelDeletion(channel: VoiceChannel): void {
  const timeout = deletionTimeouts.get(channel.id);
  if (timeout) {
    clearTimeout(timeout);
    deletionTimeouts.delete(channel.id);
    console.log(`❌ Cancelada exclusão do canal ${channel.name}, alguém entrou.`);
  }
}

/**
 * Monitora canais vazios e exclui os inativos.
 */
export function monitorEmptyChannels(client: Client): void {
  setInterval(async () => {
    const now = Date.now();

    // Itera sobre os canais de voz ativos no banco de dados
    const activeMatches = db.data?.matches.filter(match => match.isActive) || [];
    for (const match of activeMatches) {
      const channel = client.channels.cache.get(match.channelId) as VoiceChannel;

      // Verifica se o canal está vazio
      if (channel && channel.members.size === 0) {
        const timeSinceLastActivity = now - (match.lastActivity || now);

        if (timeSinceLastActivity >= EMPTY_CHANNEL_TIMEOUT) {
          try {
            await channel.delete();
            match.isActive = false;
            db.data!.stats.totalMatchesEndedByInactivity++;
            await db.write();
            console.log(`🗑️ Canal ${channel.name} excluído por inatividade.`);
          } catch (err) {
            console.error('❌ Erro ao excluir canal de voz:', err);
          }
        }
      }
    }
  }, 30 * 1000); // Verifica a cada 30 segundos
}

const client = new ExtendedClient({ intents: [] }); // Adicione os intents necessários

client.on('voiceStateUpdate', (oldState, newState) => {
  handleVoiceStateUpdate(oldState, newState, client);
});

client.login(process.env.DISCORD_TOKEN);
