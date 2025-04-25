/**
 * Este arquivo implementa a função `loadCommands`, responsável por carregar
 * os comandos do bot no cliente do Discord. Ele percorre os arquivos na pasta
 * de comandos, valida sua estrutura e os adiciona à coleção de comandos do cliente.
 */
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { Collection } from 'discord.js';
import { Logger } from './log.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/**
 * Busca todos os arquivos em um diretório de forma recursiva.
 * @param dir Diretório base.
 * @returns Lista de caminhos completos para os arquivos encontrados.
 */
async function getAllCommandFiles(dir) {
    let results = [];
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of list) {
        const filePath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            results = results.concat(await getAllCommandFiles(filePath));
        }
        else if (['.js', '.ts'].includes(path.extname(filePath).toLowerCase())) {
            results.push(filePath);
        }
    }
    return results;
}
/**
 * Carrega os comandos do bot localmente e os adiciona à coleção do cliente.
 * @param client - O cliente do Discord.
 * @returns O número de comandos carregados.
 */
export async function loadCommands(client) {
    if (!client.user?.id) {
        throw new Error('Client não está autenticado. Chame loadCommands após o evento ready.');
    }
    // Não sobrescreve a coleção se já existir
    if (!client.commands) {
        client.commands = new Collection();
    }
    const commandsPath = path.resolve(__dirname, '../commands');
    console.log(`🔍 Procurando comandos em: ${commandsPath}`);
    try {
        await fs.access(commandsPath); // Verifica se o diretório existe
    }
    catch {
        console.error(`❌ Diretório não encontrado: ${commandsPath}`);
        return 0;
    }
    // Busca todos os arquivos de comando de forma recursiva
    const commandFiles = await getAllCommandFiles(commandsPath);
    console.log('Arquivos encontrados:', commandFiles);
    let loadedCount = 0;
    for (const file of commandFiles) {
        try {
            const commandUrl = pathToFileURL(file).href;
            const commandModule = await import(commandUrl);
            if (!commandModule?.default) {
                Logger.warn(`⚠️ Arquivo ${file} não exporta default`);
                continue;
            }
            const command = commandModule.default;
            // Verifica duplicatas
            if (client.commands.has(command.data.name)) {
                Logger.warn(`⚠️ Comando duplicado: ${command.data.name}`);
                continue;
            }
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
                Logger.success(`✅ Comando carregado: ${command.data.name}`);
                loadedCount++;
            }
            else {
                Logger.warn(`⚠️ Estrutura inválida em ${file}`);
            }
        }
        catch (error) {
            Logger.error(`❌ Falha ao carregar ${file}:`, error instanceof Error ? error : new Error(String(error)));
        }
    }
    return loadedCount;
}
