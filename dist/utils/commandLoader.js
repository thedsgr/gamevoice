// src/utils/commandLoader.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import { REST, Routes } from 'discord.js';
import 'dotenv/config';
// Recria o comportamento de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Carrega todos os comandos do diretório especificado e os registra no cliente.
 * @param client - A instância do cliente estendido.
 */
export async function loadCommands(client) {
    const commandsPath = process.env.NODE_ENV === 'production'
        ? path.join(__dirname, '../../dist/commands') // Diretório em produção
        : path.join(__dirname, '../commands'); // Diretório em desenvolvimento
    const commandFiles = getCommandFiles(commandsPath);
    console.log('📂 Verificando diretório:', commandsPath);
    console.log('📂 Arquivos encontrados:', commandFiles.map(f => path.basename(f)));
    for (const filePath of commandFiles) {
        try {
            const { default: command } = await import(pathToFileURL(filePath).href);
            if (command && command.data && command.execute) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Comando carregado: ${command.data.name}`);
            }
            else {
                console.warn(`⚠️ Arquivo ${filePath} ignorado: não é um comando válido.`);
            }
        }
        catch (error) {
            console.error(`❌ Erro ao importar o comando ${filePath}:`, error);
        }
    }
    console.log(`📦 Total de comandos carregados: ${client.commands.size}`);
}
/**
 * Registra todos os comandos no Discord.
 * @param client - A instância do cliente estendido.
 */
export async function registerCommands(client) {
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        console.log('🔄 Registrando comandos...');
        const commands = client.commands.map(command => command.data.toJSON());
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Comandos registrados com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
}
function getCommandFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const extension = process.env.NODE_ENV === 'production' ? '.js' : '.ts';
    return files
        .filter(file => file.isFile() && file.name.endsWith(extension))
        .map(file => path.join(dir, file.name));
}
const commands = [
    {
        name: 'startmatch',
        description: 'Inicia uma nova partida.',
    },
    {
        name: 'endmatch',
        description: 'Finaliza a partida e limpa os canais de voz.',
    },
    {
        name: 'report',
        description: 'Reporta um problema ou jogador.',
    },
];
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
    console.error('❌ Variáveis de ambiente não configuradas corretamente.');
    if (!process.env.BOT_TOKEN)
        console.error('❌ BOT_TOKEN está ausente.');
    if (!process.env.CLIENT_ID)
        console.error('❌ CLIENT_ID está ausente.');
    if (!process.env.GUILD_ID)
        console.error('❌ GUILD_ID está ausente.');
    process.exit(1);
}
(async () => {
    try {
        console.log('🔄 Registrando comandos...');
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Comandos registrados com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
})();
//# sourceMappingURL=commandLoader.js.map