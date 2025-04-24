import { Client, ClientOptions, Collection } from "discord.js";
import { SlashCommand } from "../structs/types/SlashCommand.js";
import dotenv from "dotenv";
dotenv.config();

export class ExtendedClient extends Client {
  public commands: Collection<string, SlashCommand>;

  constructor(options: ClientOptions) {
    super(options); // Passa as opções para o construtor da classe base (Client)
    this.commands = new Collection();
  }

  /**
   * Inicia o bot e conecta ao Discord.
   */
  public async start() {
    try {
      if (!process.env.DISCORD_TOKEN) {
        throw new Error("❌ DISCORD_TOKEN não está definido no arquivo .env.");
      }

      console.log("🔑 Token carregado:", process.env.DISCORD_TOKEN);
      await this.login(process.env.DISCORD_TOKEN);
      console.log("✅ Bot conectado com sucesso!");

      // Log para verificar comandos carregados
      console.log(`📦 Total de comandos carregados: ${this.commands.size}`);
    } catch (error) {
      console.error("❌ Erro ao conectar o bot:", error);
    }
  }

  /**
   * Carrega os comandos no cliente.
   * @param loadCommands - Função para carregar os comandos.
   */
  public async loadCommands(loadCommands: (client: ExtendedClient) => Promise<void>) {
    try {
      console.log("📦 Carregando comandos...");
      await loadCommands(this);
      console.log(`✅ Comandos carregados: ${this.commands.size}`);
    } catch (error) {
      console.error("❌ Erro ao carregar comandos:", error);
    }
  }
}
