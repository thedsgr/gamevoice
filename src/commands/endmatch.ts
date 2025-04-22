// src/commands/endmatch.ts
import { SlashCommandBuilder } from 'discord.js';
import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  VoiceChannel
} from 'discord.js';
import { SlashCommand } from '../structs/types/SlashCommand.js';
import { db } from '../utils/db.js';
import { createBackup } from '../utils/backup.js';
import { hasAdminPermissions, replyNoPermission } from '../utils/permissions.js';
import { sendLog } from '../utils/log.js';

const endMatchCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("endmatch")
    .setDescription("Finaliza a partida e limpa os canais de voz"),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Lógica do comando
      await interaction.editReply('✅ Partida finalizada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao executar o comando endmatch:', error);
      await interaction.editReply('❌ Ocorreu um erro ao finalizar a partida.');
    }
  },
};

export default endMatchCommand;
