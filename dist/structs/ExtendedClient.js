// Este arquivo define a classe `ExtendedClient`, que estende a funcionalidade do cliente padrão
// do Discord.js. Ele adiciona suporte para carregar e gerenciar comandos de slash, além de
// fornecer métodos personalizados para inicializar o bot e lidar com erros de conexão.
import { Client, Collection } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
export class ExtendedClient extends Client {
    constructor(options) {
        super(options); // Passa as opções para o construtor da classe base (Client)
        this.commands = new Collection();
    }
    /**
     * Inicia o bot e conecta ao Discord.
     */
    async start() {
        try {
            // Valida se o token está definido
            if (!process.env.DISCORD_TOKEN) {
                throw new Error("❌ DISCORD_TOKEN não está definido no arquivo .env.");
            }
            console.log("🔄 Conectando ao Discord...");
            await this.login(process.env.DISCORD_TOKEN);
            console.log("✅ Bot conectado com sucesso!");
            // Log para verificar comandos carregados
            console.log(`📦 Total de comandos carregados: ${this.commands.size}`);
        }
        catch (error) {
            console.error("❌ Erro ao conectar o bot:", error);
        }
    }
}
