// Este arquivo implementa o comando `/desvincular`, que permite aos usuários removerem
// a vinculação de suas contas Riot ID do banco de dados. Ele também registra um log
// da ação para fins de auditoria.

import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
import db from '../utils/db.js';
import { Logger } from '../utils/log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('desvincular') // Nome do comando em minúsculas
    .setDescription('Desvincular seu Riot ID do banco de dados.')
    .addStringOption(option =>
      option
        .setName('riotid')
        .setDescription('Seu Riot ID (ex: nome#BR1)')
        .setRequired(true)
        .setMaxLength(30) // Limite razoável
        .setMinLength(3)   // Mínimo para nome#tag
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const discordId = interaction.user.id;
    const riotId = interaction.options.getString('riotid', true);

    try {
      // Defer a interação imediatamente
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }

      // Verificar se o usuário existe no banco de dados
      const user = await db('users').where({ userId: discordId }).first();
      if (!user) {
        await interaction.editReply({
          content: '❌ Usuário não encontrado no banco de dados.',
        });
        return;
      }

      // Remover o Riot ID do banco de dados
      const updatedAccounts = user.riotAccounts.filter((account: { riotId: string }) => account.riotId !== riotId);
      await db('users').where({ userId: discordId }).update({ riotAccounts: JSON.stringify(updatedAccounts) });

      await interaction.editReply({
        content: '✅ Riot ID desvinculado com sucesso!',
      });

      // Retornar após sucesso para evitar execução adicional
      return;
    } catch (error) {
      Logger.error(`Erro ao desvincular Riot ID (${riotId}) para o usuário ${discordId}:`, error instanceof Error ? error : new Error(String(error)));

      // Garantir que a interação seja respondida
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({
          content: '❌ Ocorreu um erro ao processar seu comando. Tente novamente mais tarde.',
          ephemeral: true,
        });
      } else {
        await interaction.editReply({
          content: '❌ Ocorreu um erro ao processar seu comando. Tente novamente mais tarde.',
        });
      }
    }
  },
};