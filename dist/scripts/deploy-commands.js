/**
 * Este arquivo implementa o script `deploy-commands`, responsável por registrar os comandos de slash
 * no Discord. Ele carrega os comandos localmente, valida sua estrutura e os registra na API do Discord
 * para um servidor específico ou globalmente. Este script é essencial para garantir que os comandos
 * estejam disponíveis e atualizados no Discord.
 */
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
dotenv.config();
// Recria o comportamento de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Valida as variáveis de ambiente necessárias.
 */
function validateEnv() {
    const requiredVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
    const missingVars = requiredVars.filter((key) => !process.env[key]);
    if (missingVars.length > 0) {
        throw new Error(`As seguintes variáveis de ambiente estão ausentes: ${missingVars.join(', ')}`);
    }
}
validateEnv();
// Configuração do REST com timeout
const rest = new REST({ version: '10', timeout: Number(process.env.REST_TIMEOUT) || 15000 }).setToken(process.env.DISCORD_TOKEN);
/**
 * Obtém todos os arquivos de comando no diretório especificado.
 * @param dir Diretório base para buscar os arquivos.
 * @returns Lista de caminhos para os arquivos de comando.
 */
function getAllCommandFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const extension = process.env.NODE_ENV === 'production' ? '.js' : '.ts';
    const commandFiles = [];
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            commandFiles.push(...getAllCommandFiles(fullPath));
        }
        else if (file.isFile() && file.name.endsWith(extension)) {
            commandFiles.push(fullPath);
        }
    }
    return commandFiles;
}
/**
 * Carrega os comandos localmente a partir do diretório de comandos.
 * @returns Lista de comandos prontos para registro.
 */
async function loadCommandsLocally() {
    const commandsPath = process.env.NODE_ENV === 'production'
        ? path.join(__dirname, '../../dist/commands') // Produção
        : path.join(__dirname, '../commands'); // Desenvolvimento
    console.log(`🔍 Procurando comandos em: ${commandsPath}`);
    if (!fs.existsSync(commandsPath)) {
        console.error(`❌ Pasta não encontrada: ${commandsPath}`);
        return [];
    }
    const commandFiles = getAllCommandFiles(commandsPath);
    if (commandFiles.length === 0) {
        console.warn('⚠️ Nenhum arquivo de comando encontrado no diretório:', commandsPath);
        return [];
    }
    const loadedCommands = [];
    for (const filePath of commandFiles) {
        try {
            const commandModule = await import(pathToFileURL(filePath).href);
            const command = commandModule?.default;
            if (command && 'data' in command && 'execute' in command) {
                const commandName = command.data.name;
                if (loadedCommands.some(cmd => cmd.name === commandName)) {
                    console.warn(`⚠️ Comando duplicado detectado: ${commandName} (${filePath})`);
                    continue; // Ignora comandos duplicados
                }
                loadedCommands.push(command.data.toJSON());
                console.log(`✅ Comando carregado: ${commandName}`);
            }
            else {
                console.warn(`[⚠️] Comando ${filePath} ignorado: está incompleto ou inválido.`);
            }
        }
        catch (error) {
            console.error(`❌ Erro ao carregar o comando ${filePath}:`, error);
        }
    }
    return loadedCommands;
}
/**
 * Remove todos os comandos registrados na API do Discord (globais e específicos de guilda).
 */
async function clearAllCommands() {
    try {
        // Limpa comandos globais
        console.log('🗑️ Limpando comandos globais...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
        console.log('✅ Comandos globais removidos com sucesso.');
        // Limpa comandos do servidor específico
        console.log('🗑️ Limpando comandos da guilda...');
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
        console.log('✅ Comandos da guilda removidos com sucesso.');
    }
    catch (error) {
        console.error('❌ Erro ao limpar comandos antigos:', error);
    }
}
/**
 * Registra os comandos de slash no Discord.
 */
(async () => {
    try {
        console.log('📂 Carregando comandos...');
        const commands = await loadCommandsLocally();
        if (commands.length === 0) {
            console.warn('⚠️ Nenhum comando carregado. O registro de comandos será ignorado.');
            return;
        }
        // Limpa todos os comandos antigos
        await clearAllCommands();
        // Registra os novos comandos
        const isGlobal = process.env.REGISTER_GLOBAL === 'true';
        const route = isGlobal
            ? Routes.applicationCommands(process.env.CLIENT_ID)
            : Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID);
        console.log(`🔁 Atualizando ${commands.length} comandos de slash...`);
        await rest.put(route, { body: commands });
        console.log('✅ Comandos registrados com sucesso!');
        // Adiciona log para exibir os comandos registrados no cliente
        console.log('Comandos registrados no cliente:', commands.map(cmd => cmd.name));
    }
    catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
})();
