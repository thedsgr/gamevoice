import { Client, Collection } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
export class ExtendedClient extends Client {
    commands;
    constructor(options) {
        super(options); // Passa as opções para o construtor da classe base (Client)
        this.commands = new Collection();
    }
    /**
     * Inicia o bot e conecta ao Discord.
     */
    async start() {
        try {
            if (!process.env.BOT_TOKEN) {
                throw new Error("❌ BOT_TOKEN não está definido no arquivo .env.");
            }
            console.log("🔑 Token carregado:", process.env.BOT_TOKEN);
            await this.login(process.env.BOT_TOKEN);
            console.log("✅ Bot conectado com sucesso!");
            // Log para verificar comandos carregados
            console.log(`📦 Total de comandos carregados: ${this.commands.size}`);
        }
        catch (error) {
            console.error("❌ Erro ao conectar o bot:", error);
        }
    }
    /**
     * Carrega os comandos no cliente.
     * @param loadCommands - Função para carregar os comandos.
     */
    async loadCommands(loadCommands) {
        try {
            console.log("📦 Carregando comandos...");
            await loadCommands(this);
            console.log(`✅ Comandos carregados: ${this.commands.size}`);
        }
        catch (error) {
            console.error("❌ Erro ao carregar comandos:", error);
        }
    }
}
//# sourceMappingURL=ExtendedClient.js.map