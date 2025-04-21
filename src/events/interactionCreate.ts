// src/events/interactionCreate.ts
import {
  ChatInputCommandInteraction,
  Interaction,
  ButtonInteraction,
  MessageFlags,
} from "discord.js";
import { ExtendedClient } from "../structs/ExtendedClient.js";
import { isOnCooldown, setCooldown } from '../services/security.js';
import { handleButtonInteraction } from '../commands/admin/painel.js';

const cooldownTime = 10; // Tempo de cooldown em segundos
const commandCooldowns = new Map<string, number>(); // Cooldown por comando

export default async function interactionCreate(
  interaction: Interaction,
  client: ExtendedClient
) {
  try {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction, client);
    } else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    } else if (interaction.isCommand() && interaction.commandName === 'startmatch') {
      await interaction.reply({
        content: 'Esta mensagem é apenas para você.',
        flags: MessageFlags.Ephemeral, // Substitua "ephemeral: true"
      });
    }
  } catch (error) {
    console.error("❌ Erro no evento interactionCreate:", error);
  }
}

async function handleSlashCommand(
  interaction: ChatInputCommandInteraction,
  client: ExtendedClient
) {
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`⚠️ Comando ${interaction.commandName} não encontrado.`);
    await interaction.reply({
      content: "❌ Comando não encontrado.",
      ephemeral: true,
    });
    return;
  }

  const userId = interaction.user.id;
  const commandName = interaction.commandName;

  // Verifica se o comando está em cooldown
  const cooldownKey = `${userId}-${commandName}`;
  if (isOnCooldown(cooldownKey, cooldownTime)) {
    await interaction.reply({
      content: `⏳ Você precisa esperar ${cooldownTime} segundos antes de usar o comando \`${commandName}\` novamente.`,
      ephemeral: true,
    });
    return;
  }

  // Define o cooldown para o comando
  setCooldown(cooldownKey);

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Erro ao executar o comando ${interaction.commandName}:`, error);
    // Se a interação já foi deferida, use editReply
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: "❌ Ocorreu um erro ao executar o comando.",
      });
    } else {
      await interaction.reply({
        content: "❌ Ocorreu um erro ao executar o comando.",
        ephemeral: true,
      });
    }
  }
}
