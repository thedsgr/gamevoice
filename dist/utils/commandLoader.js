/**
 * Este arquivo implementa a função `loadCommands`, responsável por carregar
 * os comandos do bot no cliente do Discord. Ele percorre os arquivos na pasta
 * de comandos, valida sua estrutura e os adiciona à coleção de comandos do cliente.
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { Logger } from './log.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    Logger.info(`🔍 Carregando comandos de: ${commandsPath}`);
    try {
        const commandFiles = (await fs.readdir(commandsPath))
            .filter(file => ['.js', '.ts'].includes(path.extname(file).toLowerCase()));
        if (commandFiles.length === 0) {
            Logger.warn('⚠️ Nenhum comando encontrado');
            return 0;
        }
        let loadedCount = 0;
        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                const commandUrl = new URL(`file://${filePath}`).href;
                const { default: command } = await import(commandUrl);
                if (!command?.data || !command?.execute) {
                    Logger.warn(`⚠️ Estrutura inválida em ${file}. Certifique-se de que o comando exporta 'data' e 'execute'.`);
                    continue;
                }
                client.commands.set(command.data.name, command);
                Logger.success(`✅ ${command.data.name}`);
                loadedCount++;
            }
            catch (error) {
                Logger.error(`❌ Erro em ${file}:`, error);
            }
        }
        return loadedCount;
    }
    catch (error) {
        Logger.error('❌ Erro ao carregar comandos:', error);
        return 0;
    }
}
