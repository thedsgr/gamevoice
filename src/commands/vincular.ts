/**
 * Este arquivo implementa o comando `/vincular` para vincular a conta Riot de um usuário ao Discord.
 * Ele valida o Riot ID fornecido, verifica se já está vinculado a outro usuário, salva o vínculo no banco de dados
 * e atribui o cargo "Invocadores" ao usuário no Discord. Além disso, inclui tratamento de erros robusto e rollback
 * em caso de falhas durante o processo.
 */

import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, MessageFlags, GuildMember } from 'discord.js';
import fetch from 'node-fetch';
import { Logger } from '../utils/log.js';
import db from '../utils/db.js';  
import { isValidRiotId } from '../utils/riotIdValidator.js';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

export default {
  data: new SlashCommandBuilder()
    .setName('vincular')
    .setDescription('Vincula sua conta Riot ao Discord')
    .addStringOption(option =>
      option.setName('riotid')
        .setDescription('Seu Riot ID (ex: Nome#BR1)')
        .setRequired(true)),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const userId = interaction.user.id;
    const userTag = interaction.user.tag;

    try {
      Logger.info(`Comando /vincular executado por ${userTag} (${userId})`);

      // Defer a resposta imediatamente para evitar timeout
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        Logger.info(`Resposta deferida para o comando /vincular por ${userTag}`);
      }

      const riotId = interaction.options.getString('riotid', true);

      // Validação do formato do Riot ID
      if (!isValidRiotId(riotId)) {
        Logger.warn(`Riot ID inválido fornecido por ${userTag}: ${riotId}`);
        await interaction.editReply({
          content: '❌ O Riot ID fornecido é inválido. Use o formato Nome#Região (ex: Jogador123#BR1).',
        });
        return;
      }

      // Verificação na API da Riot com tratamento de falhas
      const [name, tag] = riotId.split('#');
      const riotApiUrl = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;

      let response;
      try {
        response = await fetch(riotApiUrl, {
          headers: {
            'X-Riot-Token': RIOT_API_KEY!,
          },
        });
      } catch (networkError) {
        // Corrigido para garantir que o erro seja tratado como uma instância de Error
        const error = networkError instanceof Error ? networkError : new Error(String(networkError));
        Logger.error(`Erro de rede ao acessar a API da Riot para ${userTag}:`, error);
        await interaction.editReply({
          content: '❌ Não foi possível validar o Riot ID devido a problemas de conexão. Tente novamente mais tarde.',
        });
        return;
      }

      // Log detalhado da resposta da API
      Logger.info(`Status da resposta da API da Riot para ${userTag}: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        Logger.warn(`Detalhes do erro da API da Riot para ${userTag}: ${errorText}`);
        await interaction.editReply({
          content: '❌ Não foi possível validar o Riot ID. Verifique se ele está correto ou tente novamente mais tarde.',
        });
        return;
      }

      // Removida a variável `riotData` não utilizada
      await response.json();
      Logger.info(`Riot ID validado com sucesso para ${userTag}: ${riotId}`);

      // Verificar se o Riot ID já está vinculado
      const existingLink = await db('users').where({ riotId }).first();
      if (existingLink) {
        Logger.warn(`Tentativa de vincular Riot ID já vinculado: ${riotId}`);
        await interaction.editReply({
          content: '❌ Esta conta Riot já está vinculada a outro usuário.',
        });
        return;
      }

      // Salvar o vínculo no banco de dados com rollback em caso de falha
      const trx = await db.transaction();
      try {
        const existingUser = await trx('users').where({ userId }).first();
        if (existingUser) {
          await trx('users').where({ userId }).update({ riotId });
        } else {
          await trx('users').insert({ userId, riotId });
        }
        await trx.commit();
        Logger.info(`Vínculo salvo no banco de dados para ${userTag} (${riotId})`);
      } catch (dbError) {
        await trx.rollback();
        // Corrigido para garantir que o erro seja tratado como uma instância de Error
        const error = dbError instanceof Error ? dbError : new Error(String(dbError));
        Logger.error(`Erro ao salvar vínculo no banco de dados para ${userTag}:`, error);
        await interaction.editReply({
          content: '❌ Ocorreu um erro ao salvar o vínculo no banco de dados. Tente novamente mais tarde.',
        });
        return;
      }

      // Atribuir o cargo "Invocadores" ao usuário
      const roleId = '1365032596978798623';
      if (interaction.member instanceof GuildMember) {
        if (!interaction.member.roles.cache.has(roleId)) {
          await interaction.member.roles.add(roleId);
          Logger.info(`Cargo "Invocadores" atribuído a ${userTag}`);
        } else {
          Logger.info(`Usuário ${userTag} já possui o cargo "Invocadores".`);
        }
      } else {
        Logger.warn('Não foi possível atribuir o cargo: membro não é um GuildMember.');
      }

      // Resposta final
      await interaction.editReply({
        content: `✅ Vinculado com sucesso: ${riotId}`,
      });
      Logger.info(`Vínculo concluído com sucesso para ${userTag} (${riotId})`);
    } catch (error) {
      Logger.error(`Erro no comando /vincular executado por ${userTag}:`, error as Error);

      // Garante que sempre há uma resposta final
      try {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({
            content: '❌ Ocorreu um erro ao processar seu comando. Por favor, tente novamente mais tarde.',
            ephemeral: true,
          });
        } else {
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao processar seu comando. Por favor, tente novamente mais tarde.',
          });
        }
      } catch (secondaryError) {
        Logger.error(`Erro ao enviar mensagem de erro para ${userTag}:`, secondaryError as Error);
      }
    }
  },
};