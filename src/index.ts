import 'dotenv/config';

import "colors";
import { ExtendedClient } from "./structs/ExtendedClient.js";
import { initDB, db } from "./utils/db.js";
import { loadCommands } from "./utils/commandLoader.js";
import guildMemberAdd from "./events/guildMemberAdd.js";
import interactionCreate from "./events/interactionCreate.js";
import handleVoiceStateUpdate from './events/voiceStateUpdate.js';
import matchEnd from './events/matchEnd.js';
import { GatewayIntentBits } from 'discord.js';
import { monitorEmptyChannels } from "./services/voice.js";

// Tratamento de erros globais
process.on("uncaughtException", (err) => {
  console.error("❌ Erro não capturado:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Promessa rejeitada sem tratamento:", reason);
});

async function main() {
  try {
    console.log("🔄 Inicializando o bot...");

    // Inicializa o banco de dados
    console.log("📂 Inicializando o banco de dados...");
    await initDB();
    console.log("✅ Banco de dados inicializado.");

    // Inicializa o cliente do Discord
    const client = new ExtendedClient({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    // Carrega os comandos
    console.log("📦 Carregando comandos...");
    await loadCommands(client);
    console.log(`✅ Comandos carregados: ${client.commands.size}`);

    // Inicia o bot
    console.log("🚀 Iniciando o bot...");
    client.login(process.env.BOT_TOKEN);

    // Evento "ready" do bot
    client.once("ready", () => {
      console.log(`✅ Bot iniciado como ${client.user?.tag}`);

      // Inicializa o monitoramento de canais vazios
      monitorEmptyChannels(client);

      // Garante que o banco de dados está inicializado
      if (!db.data) {
        db.data = {
          users: [],
          reports: [],
          matches: [],
          errors: [],
          stats: {
            totalMatchesCreated: 0,
            totalMatchesEndedByInactivity: 0,
            playersKickedByReports: 0,
          },
        };
        db.write();
      }
    });

    // Eventos do cliente
    client.on("guildMemberAdd", guildMemberAdd);

    client.on("interactionCreate", async (interaction) => {
      try {
        await interactionCreate(interaction, client);
      } catch (err) {
        console.error("❌ Erro no evento interactionCreate:", err);
      }
    });

    client.on('voiceStateUpdate', handleVoiceStateUpdate);

    client.on("matchEnd", (matchId) => matchEnd(matchId, client));
  } catch (error) {
    console.error("❌ Erro durante a inicialização do bot:", error);
    process.exit(1); // Encerra o processo em caso de erro crítico
  }
}

main();

