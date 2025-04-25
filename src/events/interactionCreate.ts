import { Events, Interaction, MessageFlags } from 'discord.js';
import { ExtendedClient } from '../structs/ExtendedClient.js';
import { Logger } from '../utils/log.js';
import { isOnCooldown, setCooldown } from '../services/security.js';

const commandCooldown = 5; // Cooldown de 5 segundos

export function handleInteractionCreate(interaction: Interaction, client: ExtendedClient) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands?.get(interaction.commandName);
    if (!command) {
      Logger.warn(`Comando "${interaction.commandName}" não encontrado.`);
      try {
        await interaction.reply({
          content: '❌ Comando não encontrado.',
          ephemeral: true,
        });
      } catch (error) {
        Logger.error('Erro ao responder comando não encontrado:', error instanceof Error ? error : new Error(String(error)));
      }
      return;
    }

    // Verifica cooldown
    const userId = interaction.user.id;
    if (isOnCooldown(userId, interaction.commandName, commandCooldown)) {
      try {
        await interaction.reply({
          content: '⏳ Você está em cooldown. Tente novamente mais tarde.',
          ephemeral: true,
        });
      } catch (error) {
        Logger.error('Falha ao enviar mensagem de cooldown:', error instanceof Error ? error : new Error(String(error)));
      }
      return;
    }

    try {
      Logger.info(`Executando comando: ${interaction.commandName}`);
      await command.execute(interaction);

      // Define o cooldown somente após a execução bem-sucedida
      setCooldown(userId, interaction.commandName, commandCooldown);
    } catch (error) {
      Logger.error(`Erro ao executar o comando "${interaction.commandName}":`, error instanceof Error ? error : new Error(String(error)));

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao executar este comando.',
          });
        } else {
          await interaction.reply({
            content: '❌ Ocorreu um erro ao executar este comando.',
            ephemeral: true,
          });
        }
      } catch (replyError) {
        Logger.error('Falha ao enviar mensagem de erro:', replyError instanceof Error ? replyError : new Error(String(replyError)));
      }
    }
  });
};