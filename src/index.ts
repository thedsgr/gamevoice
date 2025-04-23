import 'dotenv/config';
import 'colors';
import { GatewayIntentBits } from 'discord.js';
import { ExtendedClient } from './structs/ExtendedClient.js';
import { initDB, db } from './utils/db.js';
import { loadCommands } from './utils/commandLoader.js';
import handleGuildMemberAdd from './events/guildMemberAdd.js';
import handleInteractionCreate from './events/interactionCreate.js';
import { handleVoiceStateUpdate } from './events/voiceStateUpdate.js';
import handleMatchEnd from './events/matchEnd.js';
import { monitorEmptyChannels } from './services/voice.js';
import { Logger } from './utils/log.js';

const client = new ExtendedClient({
  intents: [
    'Guilds',
    'GuildMessages',
    'GuildVoiceStates',
    'MessageContent',
  ],
});

client.start();

// Configuração de inicialização
const BOT_CONFIG = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  autoRegisterCommands: process.env.REGISTER_COMMANDS === 'true',
};

// Tratamento de erros globais
process.on('uncaughtException', (error) => {
  Logger.error(`Uncaught Exception: ${error.message}`, error);
});

process.on('unhandledRejection', (reason) => {
  Logger.warn(`Unhandled Rejection: ${reason}`);
});

class BotApplication {
  private client: ExtendedClient;

  constructor() {
    this.client = new ExtendedClient(BOT_CONFIG);
  }

  private async initializeDatabase(): Promise<void> {
    try {
      Logger.info('Initializing database...');
      await initDB();
      
      if (!db.data) {
        db.data = this.getDefaultDatabaseStructure();
        await db.write();
      }
      
      Logger.success('Database initialized');
    } catch (error) {
      Logger.error('Failed to initialize database', error as Error);
      throw error;
    }
  }

  private getDefaultDatabaseStructure() {
    return {
      users: [],
      reports: [],
      matches: [],
      errors: [],
      stats: {
        totalMatchesCreated: 0,
        totalMatchesEndedByInactivity: 0,
        playersKickedByReports: 0,
        totalMatchesEndedByPlayers: 0,
      },
      restrictedUsers: [],
      logs: [],
      systemLogs: [],
    };
  }

  private async loadAndRegisterCommands(): Promise<void> {
    try {
      Logger.info('Loading commands...');
      await loadCommands(this.client);
      Logger.success(`Successfully loaded ${this.client.commands.size} commands`);

      if (BOT_CONFIG.autoRegisterCommands) {
        Logger.info('Registering commands with Discord...');
        Logger.warn('Command registration skipped because "registerCommands" is not available.');
      }
    } catch (error) {
      Logger.error('Command initialization failed', error as Error);
      throw error;
    }
  }

  private registerEventHandlers(): void {
    // Eventos do cliente
    this.client.once('ready', this.onReady.bind(this));
    this.client.on('guildMemberAdd', handleGuildMemberAdd);
    this.client.on('interactionCreate', this.handleInteraction.bind(this));
    this.client.on('voiceStateUpdate', (oldState, newState) => 
      handleVoiceStateUpdate(oldState, newState, this.client));
    this.client.on('matchEnd', (matchId) => handleMatchEnd(matchId, this.client));
  }

  private async onReady(): Promise<void> {
    if (!this.client.user) return;

    Logger.success(`Bot started as ${this.client.user.tag}`);
    Logger.info(`Serving ${this.client.guilds.cache.size} guilds`);

    // Inicializa serviços pós-ready
    monitorEmptyChannels(this.client);
  }

  private async handleInteraction(interaction: any): Promise<void> {
    try {
      await handleInteractionCreate(interaction, this.client);
    } catch (error) {
      Logger.error('Interaction handling failed', error as Error);
    }
  }

  public async start(): Promise<void> {
    try {
      Logger.info('Starting bot...');
      
      await this.initializeDatabase();
      await this.loadAndRegisterCommands();
      this.registerEventHandlers();
      
      await this.client.login(process.env.BOT_TOKEN);
    } catch (error) {
      Logger.error('Bot startup failed', error as Error);
      process.exit(1);
    }
  }
}

// Inicialização da aplicação
new BotApplication().start();