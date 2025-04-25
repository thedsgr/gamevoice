/**
 * Este arquivo implementa o comando `/vincular` para vincular a conta Riot de um usuário ao Discord.
 * Ele valida o Riot ID fornecido, verifica se já está vinculado a outro usuário, salva o vínculo no banco de dados
 * e atribui o cargo "Invocadores" ao usuário no Discord.
 * 
 * Funcionalidades principais:
 * - Validação do formato do Riot ID.
 * - Verificação de vínculos existentes no banco de dados.
 * - Integração com a API da Riot para validar o Riot ID.
 * - Salvamento do vínculo no banco de dados.
 * - Atribuição do cargo "Invocadores" ao usuário no Discord.
 */

import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { linkRiotAccount } from '../services/users.js';
import { SlashCommand } from '../structs/types/SlashCommand.js';
import { db } from '../utils/db.js';
import { RiotAccount } from '../utils/shared.d.js';
import { riotClient } from '../utils/httpClient.js';

/**
 * Comando `/vincular` para vincular a conta Riot de um usuário ao Discord.
 */
export default {
  data: new SlashCommandBuilder()
    .setName('vincular')
    .setDescription('Vincula sua conta Riot ao Discord')
    .addStringOption(option =>
      option
        .setName('riotid')
        .setDescription('Seu Riot ID (ex: nome#BR1)')
        .setRequired(true)
        .setMaxLength(30) // Limite razoável
        .setMinLength(3)   // Mínimo para nome#tag
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const discordId = interaction.user.id;
    const riotId = interaction.options.getString('riotid', true);

    // Validação básica do formato
    if (!riotId.includes('#')) {
      await interaction.editReply('❌ Formato inválido. Use: nome#tag');
      return;
    }

    // Verifica se o Riot ID já está vinculado
    const existingUser = db.data!.users.find((user: { riotId?: string; discordId: string }) => user.riotId === riotId);
    if (existingUser && existingUser.discordId !== discordId) {
      await interaction.editReply('❌ Este Riot ID já está vinculado a outro usuário.');
      return;
    }

    try {
      // Valida o Riot ID usando a API
      const riotAccount = await fetchRiotAccount(riotId);
      if (!riotAccount || !riotAccount.puuid) throw new Error('Conta Riot não encontrada');

      // Salva o vínculo no banco de dados
      await linkRiotAccount(discordId, riotId, riotAccount.puuid);

      // Atribui o cargo "Invocadores"
      const member = interaction.member as GuildMember;
      const role = member.guild.roles.cache.find((r) => r.name === 'Invocadores');

      if (role) {
        await member.roles.add(role);
        await interaction.editReply(`✅ Conta Riot (${riotId}) vinculada com sucesso! Você recebeu o cargo "Invocadores".`);
      } else {
        await interaction.editReply('⚠️ O cargo "Invocadores" não foi encontrado. Informe um administrador.');
      }
    } catch (error) {
      console.error('Erro ao vincular conta:', error);
      await interaction.editReply('❌ Erro ao vincular conta. Verifique o Riot ID e tente novamente.');
    }
  },
} as SlashCommand;

export async function vincular(interaction: ChatInputCommandInteraction) {
    const riotId = interaction.options.getString('riotId', true); // Obtém o Riot ID do comando
    const userId = interaction.user.id; // ID do usuário no Discord

    try {
        // Valida o Riot ID usando a API da Riot
        const riotAccount = await fetchRiotAccount(riotId);

        // Se o Riot ID for válido, atribui o cargo "Jogador"
        const guild = interaction.guild;
        if (!guild) throw new Error('Guild não encontrada.');

        const member = await guild.members.fetch(userId);
        const role = guild.roles.cache.find(role => role.name === 'Jogador');
        if (!role) throw new Error('Cargo "Jogador" não encontrado.');

        await member.roles.add(role); // Adiciona o cargo "Jogador"

        // Responde ao usuário
        await interaction.reply(`Riot ID **${riotId}** vinculado com sucesso! Você agora tem acesso à Sala de Espera.`);
    } catch (error) {
        console.error('Erro ao vincular Riot ID:', error);
        await interaction.reply('Não foi possível vincular o Riot ID. Verifique se ele está correto e tente novamente.');
    }
}

export async function fetchRiotAccount(riotId: string): Promise<RiotAccount> {
    const [gameName, tagLine] = riotId.split('#');
    if (!gameName || !tagLine) throw new Error('Formato de Riot ID inválido');

    const response = await riotClient.get<RiotAccount>(
        `/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`
    );
    return response.data;
}