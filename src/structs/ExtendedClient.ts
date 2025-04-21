import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import { SlashCommand } from '../structs/types/SlashCommand.js';
import dotenv from "dotenv";
dotenv.config();

export class ExtendedClient extends Client {
  public commands = new Collection<string, SlashCommand>();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
      partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        Partials.User,
        Partials.ThreadMember,
      ],
    });
  }

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
