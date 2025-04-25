// Este arquivo inicializa o bot, configura os eventos e carrega os comandos.
// Ele também gerencia a conexão com o banco de dados, registra os logs e garante
// que o bot esteja pronto para operar no Discord.
// 
// Funcionalidades principais:
// - Inicializar o cliente do Discord com os intents necessários.
// - Configurar e registrar eventos do bot (ex.: guildMemberAdd, interactionCreate).
// - Carregar e registrar comandos na API do Discord.
// - Gerenciar a conexão com o banco de dados.
// - Exibir logs detalhados sobre o status do bot.

import 'dotenv/config';
import 'colors';
import { GatewayIntentBits } from 'discord.js';
import { ExtendedClient } from './structs/ExtendedClient.js';
import { initDB } from './utils/db.js';
import { loadCommands } from './utils/commandLoader.js';
import { registerCommands } from './utils/commandRegister.js';
import handleGuildMemberAdd from './events/welcome.js';
import { handleInteractionCreate } from './events/interactionCreate.js';
import { Logger } from './utils/log.js';
import { Sentry as SentryUtils } from './utils/sentry.js';

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
   * Valida as variáveis de ambiente necessárias.
   */
  private validateEnv(): void {
    const requiredVars = ['DISCORD_TOKEN'];
    const missingVars = requiredVars.filter((key) => !process.env[key]);
    if (missingVars.length > 0) {
      throw new Error(`As seguintes variáveis de ambiente estão ausentes: ${missingVars.join(', ')}`);
    }
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
      const loadedCount = await loadCommands(this.client);

      if (loadedCount === 0) {
        Logger.warn('Nenhum comando foi carregado. Verifique o diretório de comandos.');
      }

      Logger.success(`${loadedCount} comandos carregados com sucesso.`);
      await registerCommands(this.client);
    } catch (error) {
      Logger.error('Falha ao carregar os comandos:', error as Error);
      throw error;
    }
  }

  /**
   * Registra os eventos do bot.
   */
  private registerEventHandlers(): void {
    this.client.once('ready', async () => {
      console.log(`🤖 Bot conectado como ${this.client.user?.tag}`);

      // Carrega os comandos
      const loadedCount = await loadCommands(this.client);
      if (loadedCount === 0) {
        console.warn('⚠️ Nenhum comando foi carregado. Verifique o diretório de comandos.');
        return;
      }

      console.log(`📦 ${loadedCount} comandos carregados.`);

      // Registra os comandos na API
      await registerCommands(this.client);
    });
    this.client.on('guildMemberAdd', handleGuildMemberAdd);
    this.client.on('interactionCreate', (interaction) => handleInteractionCreate(interaction, this.client));
  }

  /**
   * Lógica executada quando o bot está pronto.
   */
  private async onReady(): Promise<void> {
    if (!this.client.user) return;

    Logger.success(`✅ Bot iniciado como ${this.client.user.tag}`);

    try {
      // Carrega comandos
      await loadCommands(this.client);

      // Registra comandos globalmente
      await registerCommands(this.client);

      Logger.info(`🔄 Pronto! Servindo ${this.client.guilds.cache.size} servidores.`);
    } catch (error) {
      Logger.error('❌ Erro ao carregar ou registrar comandos:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Inicia o bot.
   */
  public async start(): Promise<void> {
    try {
      Logger.info('Iniciando o bot...');
      this.validateEnv();
      await this.initializeDatabase();
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

process.on('unhandledRejection', (reason) => {
  SentryUtils.captureException(reason);
  console.error('Unhandled Rejection:', reason);
});

// Captura exceções não tratadas
process.on('uncaughtException', (error) => {
  SentryUtils.captureException(error);
  console.error('Uncaught Exception:', error);
});