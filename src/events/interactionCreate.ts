// src/events/interactionCreate.ts
import {
  ChatInputCommandInteraction,
  Interaction,
  MessageFlags,
  Client,
  Collection,
  GatewayIntentBits,
  ApplicationCommandType,
} from "discord.js";
import { ExtendedClient } from "../structs/ExtendedClient.js";
import { isOnCooldown, setCooldown } from '../services/security.js';
import { db } from '../utils/db.js';

const cooldownTime = 5000;
setTimeout(() => {
  console.log('Cooldown finalizado');
}, cooldownTime);

export default async function handleInteractionCreate(interaction: Interaction, client: ExtendedClient) {
  // Verifique se a interação é um comando válido
  if (!interaction.isCommand() || interaction.commandType !== ApplicationCommandType.ChatInput) {
    return;
  }

  const userId = interaction.user.id;

  // Atualize o lastInteraction no banco de dados
  if (db.data?.users) {
    const user = db.data.users.find((u) => u.discordId === userId);
    if (user) {
      user.lastInteraction = Date.now(); // Atualiza o timestamp
    } else {
      // Adiciona o usuário ao banco de dados se não existir
      db.data.users.push({
        discordId: userId,
        lastInteraction: Date.now(),
        riotAccounts: [], // Add the required property
      });
    }

    // Salve as alterações no banco de dados
    await db.write();
  } else {
    console.error("❌ Banco de dados não inicializado.");
    return;
  }

  // Obtenha o comando correspondente
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`⚠️ Comando ${interaction.commandName} não encontrado.`);
    return;
  }

  try {
    // Execute o comando
    await command.execute(interaction as ChatInputCommandInteraction);
  } catch (error) {
    console.error(`❌ Erro no comando ${interaction.commandName}:`, error);

    // Tratamento de erros pós-resposta
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply("⚠️ Ocorreu um erro durante a execução.");
    } else if (!interaction.replied) {
      await interaction.reply({
        content: "⚠️ Erro ao processar comando.",
        ephemeral: true,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

class LocalExtendedClient extends Client {
  commands: Collection<string, { execute: (interaction: ChatInputCommandInteraction) => Promise<void> }>;

  constructor() {
    super({ intents: [GatewayIntentBits.Guilds] });
    this.commands = new Collection();
  }
}

const client = new LocalExtendedClient();