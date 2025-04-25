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
  private client: ExtendedClient;

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
  private async initializeDatabase(): Promise<void> {
    try {
      Logger.info('Inicializando o banco de dados...');
      await initDB();
      Logger.success('Banco de dados inicializado com sucesso.');
    } catch (error) {
      Logger.error('Falha ao inicializar o banco de dados:', error as Error);
      throw error;
    }
  }

  /**
   * Carrega e registra os comandos do bot.
   */
  private async loadAndRegisterCommands(): Promise<void> {
    try {
      Logger.info('Carregando comandos...');
      await loadCommands(this.client);
      Logger.success(`Comandos carregados com sucesso: ${this.client.commands.size} comandos registrados.`);
    } catch (error) {
      Logger.error('Falha ao carregar os comandos:', error as Error);
      throw error;
    }
  }

  /**
   * Registra os eventos do bot.
   */
  private registerEventHandlers(): void {
    this.client.once('ready', this.onReady.bind(this));
    this.client.on('guildMemberAdd', handleGuildMemberAdd);
    this.client.on('interactionCreate', handleInteractionCreate);
  }

  /**
   * Lógica executada quando o bot está pronto.
   */
  private async onReady(): Promise<void> {
    if (!this.client.user) return;

    Logger.success(`Bot iniciado como ${this.client.user.tag}`);
    Logger.info(`Servindo ${this.client.guilds.cache.size} servidores.`);
  }

  /**
   * Inicia o bot.
   */
  public async start(): Promise<void> {
    try {
      Logger.info('Iniciando o bot...');
      await this.initializeDatabase();
      await this.loadAndRegisterCommands();
      this.registerEventHandlers();
      await this.client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
      Logger.error('Falha ao iniciar o bot:', error as Error);
      process.exit(1);
    }
  }
}

// Inicialização da aplicação
new BotApplication().start();