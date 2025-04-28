// Este projeto é um bot para Discord que gerencia partidas, denúncias e punições em servidores de jogos.
// Ele inclui funcionalidades como vinculação de IDs de jogos, gerenciamento de times, denúncias de comportamento inadequado,
// e aplicação de punições como banimentos e restrições de comandos.
// O bot também permite configurar canais de logs e realizar ações administrativas.
//
// Estrutura do projeto:
// - Comandos: Localizados na pasta 'commands', implementam funcionalidades acessíveis via comandos do Discord.
// - Eventos: Localizados na pasta 'events', tratam eventos do Discord, como interações e mensagens de boas-vindas.
// - Serviços: Localizados na pasta 'services', contêm lógica de negócios, como gerenciamento de partidas e segurança.
// - Utilitários: Localizados na pasta 'utils', fornecem funções auxiliares para diversas operações, como validação e logging.
// - Estruturas: Localizados na pasta 'structs', definem classes e tipos usados em todo o projeto.
//
// Tecnologias principais:
// - Node.js com TypeScript para desenvolvimento backend.
// - Discord.js para integração com a API do Discord.
// - Knex.js para interação com o banco de dados.
// - Sentry para monitoramento e rastreamento de erros.
//
// Para começar:
// 1. Configure as variáveis de ambiente no arquivo .env.
// 2. Execute 'npm install' para instalar as dependências.
// 3. Use 'npm run start' para iniciar o bot.
//
// Certifique-se de revisar a documentação em README.md para mais detalhes sobre configuração e uso.
import 'dotenv/config';
import 'colors';
import { GatewayIntentBits } from 'discord.js';
import { ExtendedClient } from './structs/ExtendedClient.js';
import { ensureDBFileExists, ensureDBInitialized } from './utils/db.js';
import { loadCommands } from './utils/commandLoader.js';
import { registerGuildCommands } from './utils/commandRegister.js';
import { handleInteractionCreate } from './events/interactionCreate.js';
import { Logger } from './utils/log.js';
import { Sentry as SentryUtils } from './utils/sentry.js';
import { validateEnvVars, logMessage } from './utils/utils.js';
import { enhancedMonitorLobby } from './services/matchMonitor';
import db from './utils/db.js';
Logger.info('Teste de inicialização do Logger: O bot está iniciando...');
class BotApplication {
    constructor() {
        // Inicializa o cliente do Discord com os intents necessários
        this.client = new ExtendedClient({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });
    }
    /**
     * Valida as variáveis de ambiente necessárias.
     */
    validateEnv() {
        validateEnvVars(['DISCORD_TOKEN']);
    }
    /**
     * Inicializa o banco de dados.
     */
    async initializeDatabase() {
        try {
            logMessage('info', 'Inicializando o banco de dados...');
            // Verificação e criação do arquivo se não existir
            await ensureDBFileExists();
            // Inicialização do banco de dados
            await ensureDBInitialized();
            logMessage('success', 'Banco de dados inicializado com sucesso.');
        }
        catch (error) {
            logMessage('error', `Falha crítica ao inicializar o banco de dados: ${error}`);
            process.exit(1);
        }
    }
    /**
     * Verifica a saúde do banco de dados.
     */
    async checkDatabaseHealth() {
        try {
            // Verifica se podemos escrever no banco de dados
            const testData = {
                timestamp: Date.now(),
                message: 'Health check',
                level: "info",
                action: 'healthCheck'
            };
            await db('systemLogs').insert(testData);
            // Remove o dado de teste
            await db('systemLogs').where(testData).del();
        }
        catch (error) {
            Logger.error('Falha na verificação de saúde do banco de dados:', error);
            throw new Error('O banco de dados não está respondendo corretamente');
        }
    }
    /**
     * Carrega e registra os comandos do bot.
     */
    async loadAndRegisterCommands() {
        try {
            Logger.info('Carregando comandos...');
            const loadedCount = await loadCommands({ commands: this.client.commands });
            if (loadedCount === 0) {
                Logger.warn('Nenhum comando foi carregado. Verifique o diretório de comandos e a estrutura dos arquivos.');
            }
            else {
                Logger.success(`${loadedCount} comandos carregados com sucesso.`);
            }
            if (!process.env.GUILD_ID) {
                Logger.error('ID do servidor de desenvolvimento (GUILD_ID) não configurado no .env.');
                throw new Error('GUILD_ID não configurado');
            }
            await registerGuildCommands(this.client, process.env.GUILD_ID);
        }
        catch (error) {
            Logger.error('Falha ao carregar ou registrar os comandos:', error);
            throw error;
        }
    }
    /**
     * Registra os eventos do bot.
     */
    registerEventHandlers() {
        // Adicionando logs de depuração para verificar o evento 'ready'
        Logger.info('Registrando evento ready...');
        this.client.once('ready', () => {
            Logger.info('Evento ready disparado. Chamando onReady...');
            this.onReady();
        });
        Logger.info('Evento ready registrado com sucesso.');
        this.client.on('interactionCreate', (interaction) => handleInteractionCreate(interaction, this.client));
        this.client.once('ready', async () => {
            if (!this.client.user || !this.client.application)
                return;
            // Carrega os comandos
            await loadCommands({ commands: this.client.commands });
            // Registra apenas no servidor específico
            const GUILD_ID = process.env.GUILD_ID; // Defina no .env
            if (GUILD_ID) {
                await registerGuildCommands(this.client, GUILD_ID);
            }
            else {
                Logger.error('❌ ID do servidor não configurado');
            }
            Logger.success(`✅ ${this.client.user.tag} está online!`);
        });
    }
    /**
     * Lógica executada quando o bot está pronto.
     */
    async onReady() {
        if (!this.client.user)
            return;
        Logger.success(`✅ Bot iniciado como ${this.client.user.tag}`);
        // Logs de diagnóstico
        Logger.info(`📊 Estatísticas iniciais:
      Servidores: ${this.client.guilds.cache.size}
      Usuários: ${this.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}
      Comandos carregados: ${this.client.commands.size}
    `);
        try {
            // Limpa o cache de comandos
            Logger.info('Cache de comandos limpo.');
            // Carrega comandos
            const loadedCount = this.client.commands.size;
            if (loadedCount === 0) {
                Logger.warn('⚠️ Nenhum comando foi carregado. Verifique o diretório de comandos.');
                return;
            }
            Logger.success(`📦 ${loadedCount} comandos carregados com sucesso.`);
            // Registra comandos globalmente (ou para uma guild específica)
            await registerGuildCommands(this.client, process.env.GUILD_ID);
            const guild = this.client.guilds.cache.get(process.env.GUILD_ID);
            if (guild) {
                const lobbyChannelId = process.env.LOBBY_CHANNEL_ID;
                enhancedMonitorLobby(this.client, lobbyChannelId, guild);
                Logger.info('Monitoramento do lobby iniciado.');
            }
            else {
                Logger.warn('Guild ou canal de lobby não configurado.');
            }
            Logger.info(`🔄 Pronto! Servindo ${this.client.guilds.cache.size} servidores.`);
        }
        catch (error) {
            Logger.error('❌ Erro no evento ready:', error instanceof Error ? error : new Error(String(error)));
            // Tenta registrar o estado do bot no DB antes de falhar
            try {
                await db('systemLogs').insert({
                    type: 'startup_failure',
                    error: error instanceof Error ? error.message : String(error),
                    timestamp: Date.now(),
                    message: 'Startup failure occurred',
                    level: 'error',
                    action: 'startup'
                });
            }
            catch (dbError) {
                console.error('Falha ao registrar erro no banco de dados:', dbError);
            }
            throw error;
        }
    }
    /**
     * Inicia o bot.
     */
    async start() {
        try {
            // Adicionando logs de tempo para medir a duração de cada etapa
            Logger.info('Iniciando o bot...');
            const startTime = Date.now();
            // 1. Validar variáveis de ambiente
            Logger.info('Validando variáveis de ambiente...');
            this.validateEnv();
            Logger.info(`Validação concluída em ${Date.now() - startTime}ms.`);
            // 2. Inicializar banco de dados
            Logger.info('Inicializando banco de dados...');
            await this.initializeDatabase();
            Logger.info(`Banco de dados inicializado em ${Date.now() - startTime}ms.`);
            // 3. Verificar saúde do banco de dados
            Logger.info('Verificando saúde do banco de dados...');
            await this.checkDatabaseHealth();
            Logger.info(`Saúde do banco de dados verificada em ${Date.now() - startTime}ms.`);
            // 4. Registrar handlers de eventos
            Logger.info('Registrando handlers de eventos...');
            this.registerEventHandlers();
            Logger.info(`Handlers de eventos registrados em ${Date.now() - startTime}ms.`);
            // 5. Iniciar o cliente do Discord
            Logger.info('Iniciando cliente do Discord...');
            await this.client.login(process.env.DISCORD_TOKEN);
            Logger.info(`Cliente do Discord iniciado em ${Date.now() - startTime}ms.`);
            Logger.info(`Bot iniciado com sucesso em ${Date.now() - startTime}ms.`);
        }
        catch (error) {
            Logger.error('Falha crítica ao iniciar o bot:', error);
            // Tentar registrar o erro no Sentry antes de sair
            try {
                SentryUtils.captureException(error);
                await SentryUtils.flush(2000); // Espera 2s para enviar
            }
            catch (sentryError) {
                console.error('Falha ao registrar erro no Sentry:', sentryError);
            }
            process.exit(1);
        }
    }
    /**
     * Desliga o bot gracefulmente.
     */
    async shutdown(reason) {
        Logger.info(`Desligando graceful... Motivo: ${reason}`);
        try {
            // Registrar desligamento no DB
            await db('systemLogs').insert({
                type: 'shutdown',
                timestamp: Date.now(),
                reason,
                message: `Shutdown initiated: ${reason}`,
                level: 'info',
                action: 'shutdown'
            });
            // Destruir o cliente do Discord
            if (this.client) {
                this.client.destroy();
            }
        }
        catch (error) {
            Logger.error('Erro durante desligamento:', error instanceof Error ? error : new Error(String(error)));
        }
    }
}
// Inicialização da aplicação
const bot = new BotApplication();
bot.start();
// Configura handlers para sinais de desligamento
process.on('SIGINT', async () => {
    await bot.shutdown('SIGINT');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await bot.shutdown('SIGTERM');
    process.exit(0);
});
process.on('unhandledRejection', (reason) => {
    SentryUtils.captureException(reason);
    if (reason instanceof Error) {
        Logger.error('Unhandled Rejection:', reason);
    }
    else {
        Logger.error('Unhandled Rejection:', new Error(String(reason)));
    }
});
process.on('uncaughtException', (error) => {
    SentryUtils.captureException(error);
    Logger.error('Uncaught Exception:', error);
});
