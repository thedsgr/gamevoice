"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendedClient = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
class ExtendedClient extends discord_js_1.Client {
    constructor() {
        super({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMembers,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.GuildVoiceStates,
            ],
            partials: [
                discord_js_1.Partials.Channel,
                discord_js_1.Partials.GuildMember,
                discord_js_1.Partials.Message,
                discord_js_1.Partials.Reaction,
                discord_js_1.Partials.User,
                discord_js_1.Partials.ThreadMember,
            ],
        });
        this.commands = new discord_js_1.Collection();
    }
    async start() {
        try {
            console.log("🔑 Token carregado:", process.env.BOT_TOKEN);
            await this.login(process.env.BOT_TOKEN);
            console.log("✅ Bot conectado com sucesso!");
        }
        catch (error) {
            console.error("❌ Erro ao conectar o bot:", error);
        }
    }
}
exports.ExtendedClient = ExtendedClient;
//# sourceMappingURL=ExtendedClient.js.map