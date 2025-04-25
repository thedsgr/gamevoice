// Este arquivo inicializa o bot, configura os eventos e carrega os comandos.
// Ele também gerencia a conexão com o banco de dados e registra os logs.
import 'dotenv/config';
import 'colors';
import { GatewayIntentBits } from 'discord.js';
import { ExtendedClient } from './structs/ExtendedClient.js';
import { initDB } from './utils/db.js';
import { loadCommands } from './utils/commandLoader.js';
import handleGuildMemberAdd from './events/guildMemberAdd.js';
import { handleInteractionCreate } from './events/interactionCreate.js';
import { Logger } from './utils/log.js';
class BotApplication {
    constructor() {
        // Inicializa o cliente do Discord com os intents necessários
        this.client = new ExtendedClient({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });
    }
    /**
     * Inicializa o banco de dados.
     */
    async initializeDatabase() {
        try {
            Logger.info('Inicializando o banco de dados...');
            await initDB();
            Logger.success('Banco de dados inicializado com sucesso.');
        }
        catch (error) {
            Logger.error('Falha ao inicializar o banco de dados:', error);
            throw error;
        }
    }
    /**
     * Carrega e registra os comandos do bot.
     */
    async loadAndRegisterCommands() {
        try {
            Logger.info('Carregando comandos...');
            await loadCommands(this.client);
            Logger.success(`Comandos carregados com sucesso: ${this.client.commands.size} comandos registrados.`);
        }
        catch (error) {
            Logger.error('Falha ao carregar os comandos:', error);
            throw error;
        }
    }
    /**
     * Registra os eventos do bot.
     */
    registerEventHandlers() {
        this.client.once('ready', this.onReady.bind(this));
        this.client.on('guildMemberAdd', handleGuildMemberAdd);
        this.client.on('interactionCreate', handleInteractionCreate);
    }
    /**
     * Lógica executada quando o bot está pronto.
     */
    async onReady() {
        if (!this.client.user)
            return;
        Logger.success(`Bot iniciado como ${this.client.user.tag}`);
        Logger.info(`Servindo ${this.client.guilds.cache.size} servidores.`);
    }
    /**
     * Inicia o bot.
     */
    async start() {
        try {
            Logger.info('Iniciando o bot...');
            await this.initializeDatabase();
            await this.loadAndRegisterCommands();
            this.registerEventHandlers();
            await this.client.login(process.env.DISCORD_TOKEN);
        }
        catch (error) {
            Logger.error('Falha ao iniciar o bot:', error);
            process.exit(1);
        }
    }
}
// Inicialização da aplicação
new BotApplication().start();
