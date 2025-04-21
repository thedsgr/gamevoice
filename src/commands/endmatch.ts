// src/commands/endmatch.ts
import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, VoiceChannel } from 'discord.js';
import { SlashCommand } from '../structs/types/SlashCommand.js';
import { db } from '../utils/db.js';

const endMatchCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("endmatch")
    .setDescription("Finaliza a partida e limpa o canal de voz"),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: "❌ Este comando só pode ser usado em um servidor.",
        ephemeral: true,
      });
      return;
    }

    try {
      const activeChannelId = db.data?.activeVoiceChannel;

      if (!activeChannelId) {
        await interaction.reply({
          content: "❌ Não há nenhuma partida ativa no momento.",
          ephemeral: true,
        });
        return;
      }

      const voiceChannel = guild.channels.cache.get(activeChannelId) as VoiceChannel;

      if (!voiceChannel) {
        await interaction.reply({
          content: "❌ O canal de voz não foi encontrado. Ele pode ter sido excluído.",
          ephemeral: true,
        });
        db.data!.activeVoiceChannel = undefined;
        await db.write();
        return;
      }

      await voiceChannel.delete("Partida finalizada");
      db.data!.activeVoiceChannel = undefined;
      await db.write();

      await interaction.reply({
        content: "✅ Partida finalizada e canal de voz limpo.",
        ephemeral: true,
      });
    } catch (error) {
      console.error("❌ Erro ao finalizar a partida:", error);
      await interaction.reply({
        content: "❌ Ocorreu um erro ao finalizar a partida.",
        ephemeral: true,
      });
    }
  },
};

export default endMatchCommand;
