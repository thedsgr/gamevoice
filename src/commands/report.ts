import { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';
import { CommandInteractionOptionResolver } from 'discord.js';
import { SlashCommand } from '../structs/types/SlashCommand.js';
import db from '../utils/db.js';

// Definindo tipo para jogadores da última partida
interface LastMatchPlayer {
  id: string;
  name: string;
}

// Extendendo a interface User para incluir lastMatchPlayers
// Isso permite que a interface User tenha uma propriedade opcional chamada lastMatchPlayers
// que armazena informações sobre os jogadores da última partida.
declare module '../types/user.d.js' {
  interface User {
    lastMatchPlayers?: LastMatchPlayer[];
  }
}

const reportCommand: SlashCommand = {
  // Configuração do comando /report usando SlashCommandBuilder
  data: new SlashCommandBuilder()
    .setName('report') // Nome do comando
    .setDescription('Denunciar comportamento agressivo de um jogador') // Descrição do comando
    .addStringOption(opt =>
      opt
        .setName('alvo') // Nome da opção para identificar o jogador alvo
        .setDescription('Jogador a ser denunciado') // Descrição da opção
        .setRequired(true) // Torna a opção obrigatória
    )
    .addStringOption(opt =>
      opt
        .setName('motivo') // Nome da opção para o motivo da denúncia
        .setDescription('Escolha o motivo da denúncia') // Descrição da opção
        .setRequired(true) // Torna a opção obrigatória
        .addChoices( // Lista de motivos disponíveis para escolha
          { name: 'Discurso de ódio', value: 'discurso_de_odio' },
          { name: 'Racismo', value: 'racismo' },
          { name: 'Sexismo / Machismo', value: 'sexismo_machismo' },
          { name: 'Comportamento antijogo', value: 'comportamento_antijogo' },
          { name: 'Assédio', value: 'assedio' },
          { name: 'Comportamento tóxico', value: 'comportamento_toxico' },
          { name: 'Spam ou flood no chat de voz', value: 'spam_flood' }
        )
    ) as SlashCommandBuilder,

  async execute(interaction: CommandInteraction) {
    // Obtendo as opções fornecidas pelo usuário ao executar o comando
    const options = interaction.options as CommandInteractionOptionResolver;
    const reporterId = interaction.user.id; // ID do usuário que está denunciando
    const targetId = options.getString('alvo', true); // ID do jogador alvo da denúncia
    const reason = options.getString('motivo', true); // Motivo da denúncia

    // Verifica se o usuário está tentando denunciar a si mesmo
    if (reporterId === targetId) {
      await interaction.reply({
        content: '❌ Você não pode denunciar a si mesmo.',
        ephemeral: true, // Mensagem visível apenas para o usuário que executou o comando
      });
      return;
    }

    try {
      // Verifica se o usuário que está denunciando existe no banco de dados
      const reporter = await db('users').where({ userId: reporterId }).first();
      if (!reporter) {
        await interaction.reply({
          content: '❌ Usuário não encontrado no banco de dados.',
          ephemeral: true,
        });
        return;
      }

      // Verifica se o jogador alvo da denúncia existe no banco de dados
      const target = await db('users').where({ userId: targetId }).first();
      if (!target) {
        await interaction.reply({
          content: '❌ Jogador alvo não encontrado no banco de dados.',
          ephemeral: true,
        });
        return;
      }

      // Insere a denúncia no banco de dados
      await db('reports').insert({
        reporterId, // ID do usuário que está denunciando
        targetId, // ID do jogador alvo da denúncia
        reason, // Motivo da denúncia
        timestamp: Date.now(), // Timestamp da denúncia
      });

      // Responde ao usuário confirmando o registro da denúncia
      await interaction.reply({
        content: `✅ Denúncia registrada com sucesso contra **${target.name}** pelo motivo: **${reason}**.`,
        ephemeral: true,
      });
    } catch (error) {
      // Captura e registra erros que possam ocorrer durante a execução
      console.error('Erro ao registrar denúncia:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao processar sua denúncia. Tente novamente mais tarde.',
        ephemeral: true,
      });
    }
  },
};

export default reportCommand;