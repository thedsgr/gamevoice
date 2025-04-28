// Este comando permite que administradores definam um canal de texto para receber logs do bot.
// O ID do canal é salvo no banco de dados para que o bot possa enviar logs importantes
// para o canal configurado.

import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType, PermissionsBitField, CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import { SlashCommand } from '../structs/types/SlashCommand.js';
import db from '../utils/db.js';

const setLogChannelCommand: SlashCommand = {
  // Configuração do comando /setlogchannel
  data: new SlashCommandBuilder()
    .setName('setlogchannel') // Nome do comando
    .setDescription('Define o canal de log do servidor') // Descrição do comando
    .addChannelOption(opt =>
      opt
        .setName('canal') // Nome da opção para o canal
        .setDescription('Canal para logs') // Descrição da opção
        .setRequired(true) // Torna a opção obrigatória
    ) as SlashCommandBuilder,

  async execute(interaction: CommandInteraction) {
    // Obtendo as opções fornecidas pelo usuário
    const options = interaction.options as CommandInteractionOptionResolver;
    const channel = options.getChannel('canal', true); // Canal selecionado pelo usuário

    try {
      // Verifica se o usuário tem permissão de administrador
      if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
        console.warn(`[setlogchannel] Permissão negada para o usuário ${interaction.user.tag} (${interaction.user.id}).`);
        await interaction.reply({
          content: '❌ Você não tem permissão para usar este comando. Apenas administradores podem definir o canal de logs.',
          ephemeral: true, // Mensagem visível apenas para o usuário
        });
        return;
      }

      // Valida se o canal é um canal de texto
      if (channel.type !== ChannelType.GuildText) {
        console.warn(`[setlogchannel] Canal inválido selecionado por ${interaction.user.tag} (${interaction.user.id}): ${channel.id}`);
        await interaction.reply({
          content: '❌ O canal selecionado não é um canal de texto válido. Por favor, escolha um canal de texto.',
          ephemeral: true,
        });
        return;
      }

      // Salva o ID do canal no banco de dados
      try {
        const updateResult = await db('settings').update({ logChannelId: channel.id });

        // Verifica se a atualização foi bem-sucedida
        if (!updateResult) {
          console.error(`[setlogchannel] Falha ao atualizar o canal de logs no banco de dados para ${interaction.user.tag} (${interaction.user.id}).`);
          await interaction.reply({
            content: '❌ Não foi possível salvar o canal de logs no banco de dados. Tente novamente mais tarde.',
            ephemeral: true,
          });
          return;
        }

        console.info(`[setlogchannel] Canal de logs definido para ${channel.id} por ${interaction.user.tag} (${interaction.user.id}).`);

        // Responde ao usuário confirmando a configuração
        await interaction.reply({
          content: `✅ Canal de logs definido para ${channel.toString()}.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(`[setlogchannel] Erro ao salvar o canal de logs no banco de dados para ${interaction.user.tag} (${interaction.user.id}):`, error);
        await interaction.reply({
          content: '❌ Ocorreu um erro ao tentar salvar o canal de logs. Tente novamente mais tarde.',
          ephemeral: true,
        });
      }
    } catch (error) {
      // Captura erros inesperados e responde ao usuário
      console.error(`[setlogchannel] Erro inesperado para ${interaction.user.tag} (${interaction.user.id}):`, error);
      await interaction.reply({
        content: '❌ Ocorreu um erro inesperado. Tente novamente mais tarde.',
        ephemeral: true,
      });
    }
  },
};

export default setLogChannelCommand;
