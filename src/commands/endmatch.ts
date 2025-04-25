// Este comando finaliza a partida, limpa os canais de voz e realiza ações necessárias
// para encerrar o estado da partida no servidor.

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, GuildMember, VoiceChannel } from 'discord.js';
import { SlashCommand } from '../structs/types/SlashCommand.js';

const endMatchCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("endmatch")
    .setDescription("Finaliza a partida e limpa os canais de voz"),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Verifica se o usuário tem permissão para gerenciar canais
      const member = interaction.member as GuildMember;
      if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        console.log("O membro não tem permissão para gerenciar canais.");
        await interaction.editReply('❌ Você não tem permissão para finalizar a partida.');
        return;
      }

      // Obtém os canais de voz na guilda
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply('❌ Este comando só pode ser usado em um servidor.');
        return;
      }

      const voiceChannels = guild.channels.cache.filter(
        (channel) => channel.isVoiceBased() && channel.name.toLowerCase().includes('partida')
      ) as Map<string, VoiceChannel>;

      // Limpa os canais de voz relacionados à partida
      for (const [channelId, channel] of voiceChannels) {
        try {
          await channel.delete(`Partida finalizada por ${interaction.user.tag}`);
          console.log(`Canal de voz ${channel.name} deletado.`);
        } catch (error) {
          console.error(`Erro ao deletar o canal ${channel.name}:`, error);
        }
      }

      // Responde ao usuário
      await interaction.editReply('✅ Partida finalizada e canais de voz limpos com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao executar o comando endmatch:', error);
      await interaction.editReply('❌ Ocorreu um erro ao finalizar a partida.');
    }
  },
};

export default endMatchCommand;
