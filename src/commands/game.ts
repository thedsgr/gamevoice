import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, VoiceChannel } from 'discord.js';
import { fetchRiotAccount } from '../utils/riotAPI.js';
import { ExtendedClient } from '../structs/ExtendedClient.js';

export default {
  // Configuração do comando /game
  data: new SlashCommandBuilder()
    .setName('game') // Nome do comando
    .setDescription('Testa o bot e a API da Riot em cenários de falha ao mover o usuário para a sala do time.'),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const userId = interaction.user.id; // ID do usuário que executou o comando

      // Simula a busca de informações do usuário na API da Riot
      const riotId = 'Jhin#9056';
      const riotAccount = await fetchRiotAccount(riotId);

      if (!riotAccount) {
        await interaction.reply('❌ Não foi possível encontrar informações do Riot ID na API da Riot.');
        return;
      }

      // Responde ao usuário com as informações obtidas
      await interaction.reply(`✅ Teste bem-sucedido! Informações do Riot ID: ${riotAccount.gameName}#${riotAccount.tagLine}`);
    } catch (error) {
      // Captura e registra erros
      console.error('Erro ao executar o comando /game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      // Responde ao usuário com uma mensagem de erro
      await interaction.reply(`❌ Ocorreu um erro ao executar este comando: ${errorMessage}`);
    }
  },
};

/**
 * Função auxiliar para testar o bot movendo o usuário para a sala do time.
 * @param client - Instância do cliente estendido.
 * @param userId - ID do usuário a ser movido.
 * @param teamName - Nome do time.
 */
export async function testGame(client: ExtendedClient, userId: string, teamName: string) {
  try {
    // Verifica se o cliente está inicializado corretamente
    if (!client || !client.guilds.cache.size) {
      console.error('Cliente não inicializado ou guildas não carregadas.');
      return;
    }

    // Obtém as informações do time pelo nome
    const team = client.teams?.get(teamName);
    if (!team) {
      console.log('Time não encontrado.');
      return;
    }

    // Valida se o ID do canal de voz do time é válido
    const voiceChannel = client.channels.cache.get(team.voiceChannelId);
    if (!(voiceChannel instanceof VoiceChannel)) {
      console.log('Canal de voz do time não encontrado ou não é um canal de voz.');
      return;
    }

    // Busca o membro pelo ID e tenta movê-lo para o canal de voz
    const member = await client.guilds.cache.first()?.members.fetch(userId);
    if (member && member.voice.channel) {
      await member.voice.setChannel(voiceChannel);
      console.log(`Usuário ${userId} movido para a sala do time ${teamName}.`);
    } else {
      console.log(`Usuário ${userId} não está em um canal de voz.`);
    }
  } catch (error) {
    // Captura e registra erros inesperados
    console.error('Erro ao executar a função testGame:', error);
  }
}