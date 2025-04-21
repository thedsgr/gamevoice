// src/commands/endmatch.ts
import { SlashCommandBuilder } from '@discordjs/builders';
import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  VoiceChannel
} from 'discord.js';
import { SlashCommand } from '../../structs/types/SlashCommand.js';
import { db } from '../../utils/db.js';
import { createBackup } from '../../utils/backup.js';
import { hasAdminPermissions, replyNoPermission } from '../../utils/permissions.js';

const endMatchCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("endmatch")
    .setDescription("Finaliza a partida e limpa os canais de voz"),

  async execute(interaction: ChatInputCommandInteraction) {
    // Verifica permissões
    if (!hasAdminPermissions(interaction)) {
      await replyNoPermission(interaction);
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      // Lógica para finalizar a partida e limpar os canais
      // Exemplo: deletar o canal de voz ativo
      const activeChannelId = db.data?.activeVoiceChannel;
      if (activeChannelId) {
        const guild = interaction.guild;
        if (!guild) {
          await interaction.editReply({
            content: "⚠️ Não foi possível encontrar o servidor (guild).",
          });
          return;
        }
        const activeChannel = guild.channels.cache.get(activeChannelId);
        if (activeChannel?.isVoiceBased()) {
          await activeChannel.delete();
          db.data.activeVoiceChannel = undefined;
          await db.write();
          await createBackup();
          await interaction.editReply({
            content: "✅ Partida finalizada e canal de voz limpo.",
          });
        } else {
          await interaction.editReply({
            content: "⚠️ Nenhum canal de voz ativo encontrado.",
          });
        }
      } else {
        await interaction.editReply({
          content: "⚠️ Nenhum canal de voz ativo encontrado.",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao executar o comando endmatch:", error);
      await interaction.editReply({
        content: "❌ Ocorreu um erro ao finalizar a partida.",
      });
    }
  },
};

export default endMatchCommand;
