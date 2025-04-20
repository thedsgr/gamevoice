import { VoiceChannel, GuildMember } from "discord.js";

/**
 * Limpa um canal de voz, desconectando todos os membros e deletando o canal.
 * @param channel - O canal de voz a ser limpo.
 */
export async function cleanupVoiceChannel(channel: VoiceChannel) {
  console.log(`🔄 Iniciando limpeza do canal: ${channel.name}`);

  // Desconecta todos os membros do canal
  for (const [, member] of channel.members) {
    try {
      await (member as GuildMember).voice.setChannel(null);
      console.log(`✅ Membro ${member.user.tag} desconectado com sucesso.`);
    } catch (error) {
      console.warn(`⚠️ Não consegui desconectar ${member.user.tag}:`, error);
    }
  }

  // Deleta o canal de voz
  try {
    await channel.delete("Partida finalizada – canal limpo");
    console.log(`🗑 Canal ${channel.name} removido com sucesso.`);
  } catch (error) {
    console.error(`❌ Erro ao deletar canal ${channel.name}:`, error);
  }
}
