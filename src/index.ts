import dotenv from "dotenv";
dotenv.config();

import "colors";
import { ExtendedClient } from "./structs/ExtendedClient.js";
import { initDB } from "./utils/db.js";
import { loadCommands } from "./utils/commandLoader.js";
import guildMemberAdd from "./events/guildMemberAdd.js";
import interactionCreate from "./events/interactionCreate.js";
import matchEnd from "./events/matchEnd.js";
import handleVoiceStateUpdate from './events/voiceStateUpdate.js';

async function main() {
  try {
    console.log("🔄 Inicializando o bot...");

    // Inicializa o banco de dados
    console.log("📂 Inicializando o banco de dados...");
    await initDB();
    console.log("✅ Banco de dados inicializado.");

    // Cria a instância do cliente
    const client = new ExtendedClient();

    // Carrega os comandos
    console.log("📦 Carregando comandos...");
    await loadCommands(client);
    console.log(`✅ Comandos carregados: ${client.commands.size}`);

    // Inicia o bot
    console.log("🚀 Iniciando o bot...");
    client.start();

    // Eventos do cliente
    client.on("ready", () => {
      console.log("✅ Bot online!".green);
    });

    client.on("matchEnd", matchEnd);

    client.on("guildMemberAdd", guildMemberAdd);

    client.on("interactionCreate", async (interaction) => {
      try {
        await interactionCreate(interaction, client);
      } catch (err) {
        console.error("❌ Erro no evento interactionCreate:", err);
      }
    });

    client.on('voiceStateUpdate', (oldState, newState) => {
      handleVoiceStateUpdate(oldState, newState);
    });
  } catch (error) {
    console.error("❌ Erro durante a inicialização do bot:", error);
    process.exit(1); // Encerra o processo em caso de erro crítico
  }
}

main();