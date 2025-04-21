// src/events/matchEnd.ts
import { cleanupVoiceChannel } from "../utils/cleanup.js";
import { VoiceChannel } from "discord.js";

export default async function matchEnd(channel: VoiceChannel) {
  console.log(`🔔 Partida finalizada — iniciando limpeza do canal: ${channel.name}`);

  try {
    await cleanupVoiceChannel(channel);
    console.log(`✅ Canal ${channel.name} limpo com sucesso.`);
  } catch (error) {
    console.error(`❌ Erro ao limpar o canal ${channel.name}:`, error);
  }
}
