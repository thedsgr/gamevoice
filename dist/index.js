"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
require("colors");
const ExtendedClient_1 = require("./structs/ExtendedClient");
const db_1 = require("./utils/db");
const commandLoader_1 = require("./utils/commandLoader");
const guildMemberAdd_1 = tslib_1.__importDefault(require("./events/guildMemberAdd"));
const interactionCreate_1 = tslib_1.__importDefault(require("./events/interactionCreate"));
const matchEnd_1 = tslib_1.__importDefault(require("./events/matchEnd"));
const voiceStateUpdate_1 = tslib_1.__importDefault(require("./events/voiceStateUpdate"));
async function main() {
    try {
        console.log("🔄 Inicializando o bot...");
        // Inicializa o banco de dados
        console.log("📂 Inicializando o banco de dados...");
        await (0, db_1.initDB)();
        console.log("✅ Banco de dados inicializado.");
        // Cria a instância do cliente
        const client = new ExtendedClient_1.ExtendedClient();
        // Carrega os comandos
        console.log("📦 Carregando comandos...");
        await (0, commandLoader_1.loadCommands)(client);
        console.log(`✅ Comandos carregados: ${client.commands.size}`);
        // Inicia o bot
        console.log("🚀 Iniciando o bot...");
        client.start();
        // Eventos do cliente
        client.on("ready", () => {
            console.log("✅ Bot online!".green);
        });
        client.on("matchEnd", matchEnd_1.default);
        client.on("guildMemberAdd", guildMemberAdd_1.default);
        client.on("interactionCreate", async (interaction) => {
            try {
                await (0, interactionCreate_1.default)(interaction, client);
            }
            catch (err) {
                console.error("❌ Erro no evento interactionCreate:", err);
            }
        });
        client.on('voiceStateUpdate', (oldState, newState) => {
            (0, voiceStateUpdate_1.default)(oldState, newState);
        });
    }
    catch (error) {
        console.error("❌ Erro durante a inicialização do bot:", error);
        process.exit(1); // Encerra o processo em caso de erro crítico
    }
}
main();
//# sourceMappingURL=index.js.map