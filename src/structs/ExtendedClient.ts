import { Client, ClientOptions, Collection, GatewayIntentBits, Partials } from "discord.js";
import { SlashCommand } from '../structs/types/SlashCommand.js';
import dotenv from "dotenv";
dotenv.config();

export class ExtendedClient extends Client {
  public commands: Collection<string, SlashCommand>;

  constructor(options: ClientOptions) {
    super(options); // Passa as opções para o construtor da classe base (Client)
    this.commands = new Collection();
  }

  // Adicione métodos ou propriedades personalizadas aqui, se necessário

  public async start() {
    try {
      console.log("🔑 Token carregado:", process.env.BOT_TOKEN);
      await this.login(process.env.BOT_TOKEN);
      console.log("✅ Bot conectado com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao conectar o bot:", error);
    }
  }
}
