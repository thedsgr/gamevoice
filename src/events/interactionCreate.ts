// src/events/interactionCreate.ts
import {
  ChatInputCommandInteraction,
  Interaction,
} from "discord.js";
import { ExtendedClient } from "../structs/ExtendedClient.js";

export default async function interactionCreate(
  interaction: Interaction,
  client: ExtendedClient
) {
  try {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction, client);
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
