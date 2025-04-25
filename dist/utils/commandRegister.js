import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Logger } from '../utils/log.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { SlashCommandBuilder } from '@discordjs/builders';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/**
 * Valida a estrutura de um comando.
 */
function isValidCommand(command) {
    return (command &&
        command.data instanceof SlashCommandBuilder &&
        typeof command.execute === 'function');
}
/**
 * Busca todos os arquivos em um diretório de forma recursiva.
 * @param dir Diretório base.
 * @returns Lista de caminhos completos para os arquivos encontrados.
 */
async function getAllCommandFiles(dir) {
    let results = [];
    const list = await fs.readdir(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            results = results.concat(await getAllCommandFiles(filePath));
        }
        else if (file.endsWith('.js') || file.endsWith('.ts')) {
            results.push(filePath);
        }
    }
    return results;
}
/**
 * Carrega os comandos localmente a partir do diretório de comandos.
 * @param client - O cliente do Discord.
 * @returns O número de comandos carregados.
 */
export async function loadCommands(client) {
    const commandsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../commands');
    console.log(`🔍 Procurando comandos em: ${commandsPath}`);
    try {
        await fs.access(commandsPath); // Verifica se o diretório existe
    }
    catch {
        console.error(`❌ Pasta não encontrada: ${commandsPath}`);
        return 0;
    }
    const commandFiles = await getAllCommandFiles(commandsPath);
    if (commandFiles.length === 0) {
        console.warn('⚠️ Nenhum arquivo de comando encontrado no diretório:', commandsPath);
        return 0;
    }
    console.log('Arquivos encontrados:', commandFiles);
    let loadedCount = 0;
    for (const file of commandFiles) {
        try {
            // Converte o caminho para URL no formato file://
            const module = await import(pathToFileURL(file).href);
            const command = module?.default;
            if (!isValidCommand(command)) {
                Logger.warn(`⚠️ Estrutura inválida em ${file}`);
                continue;
            }
            if (client.commands.has(command.data.name)) {
                Logger.warn(`⚠️ Comando duplicado: ${command.data.name}`);
                continue;
            }
            client.commands.set(command.data.name, command);
            Logger.success(`✅ Comando carregado: ${command.data.name}`);
            loadedCount++;
        }
        catch (error) {
            Logger.error(`❌ Erro ao carregar o comando ${file}:`, error instanceof Error ? error : new Error(String(error)));
        }
    }
    return loadedCount;
}
// Cache de comandos já registrados
const registeredCommandsCache = new Set();
export async function registerCommands(client, guildId) {
    if (!client.user?.id) {
        Logger.error('❌ Client não autenticado');
        return false;
    }
    if (client.commands.size === 0) {
        Logger.warn('⚠️ Nenhum comando para registrar');
        return false;
    }
    const cacheKey = guildId ? `${client.user.id}-${guildId}` : `${client.user.id}-global`;
    if (registeredCommandsCache.has(cacheKey)) {
        Logger.info('ℹ️ Comandos já registrados. Ignorando registro duplicado.');
        return true;
    }
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        const commandsData = Array.from(client.commands.values()).map(c => c.data.toJSON());
        // Limpa comandos existentes primeiro
        await rest.put(guildId
            ? Routes.applicationGuildCommands(client.user.id, guildId)
            : Routes.applicationCommands(client.user.id), { body: [] });
        // Registra os novos comandos
        await rest.put(guildId
            ? Routes.applicationGuildCommands(client.user.id, guildId)
            : Routes.applicationCommands(client.user.id), { body: commandsData });
        registeredCommandsCache.add(cacheKey);
        Logger.success(`✅ ${commandsData.length} comandos registrados ${guildId ? 'na guild' : 'globalmente'}`);
        return true;
    }
    catch (error) {
        Logger.error('❌ Erro no registro:', error instanceof Error ? error : new Error(String(error)));
        return false;
    }
}
export function clearCommandsCache() {
    registeredCommandsCache.clear();
}
