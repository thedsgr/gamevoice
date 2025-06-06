import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { ExtendedClient } from '../structs/ExtendedClient.js';
import { Logger } from '../utils/log.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { SlashCommandBuilder } from '@discordjs/builders';
import { SlashCommand } from '../structs/types/SlashCommand.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = new Logger();

// Cache de comandos já registrados
const registeredCommandsCache = new Set<string>();

/**
 * Valida a estrutura de um comando.
 */
function isValidCommand(command: any): command is SlashCommand {
  return (
    command &&
    command.data instanceof SlashCommandBuilder &&
    typeof command.execute === 'function'
  );
}

/**
 * Busca todos os arquivos em um diretório de forma recursiva.
 * @param dir Diretório base.
 * @returns Lista de caminhos completos para os arquivos encontrados.
 */
async function getAllCommandFiles(dir: string): Promise<string[]> {
  let results: string[] = [];
  const list = await fs.readdir(dir, { withFileTypes: true });

  for (const dirent of list) {
    const filePath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      // Busca recursiva em subpastas
      results = results.concat(await getAllCommandFiles(filePath));
    } else if (['.js', '.ts'].includes(path.extname(filePath).toLowerCase())) {
      // Adiciona apenas arquivos .js ou .ts
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
export async function loadCommands(client: ExtendedClient): Promise<number> {
  const commandsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../commands');
  console.log(`🔍 Procurando comandos em: ${commandsPath}`);

  try {
    await fs.access(commandsPath); // Verifica se o diretório existe
  } catch {
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
      const command = module?.default as SlashCommand;

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
    } catch (error) {
      Logger.error(`❌ Erro ao carregar o comando ${file}:`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  return loadedCount;
}

/**
 * Registra comandos no Discord, evitando duplicações com o uso de cache.
 * @param client - O cliente do Discord.
 * @param guildId - ID da guilda (opcional, para registro local).
 * @returns `true` se os comandos foram registrados com sucesso, `false` caso contrário.
 */
export async function registerGuildCommands(client: ExtendedClient, guildId: string): Promise<boolean> {
  if (!client.user?.id) {
    Logger.error('❌ Client não autenticado. Certifique-se de que o bot está logado.');
    return false;
  }

  if (client.commands.size === 0) {
    Logger.warn('⚠️ Nenhum comando para registrar. Certifique-se de que os comandos foram carregados.');
    return false;
  }

  const cacheKey = `${client.user.id}-${guildId}`;
  if (registeredCommandsCache.has(cacheKey)) {
    Logger.info(`ℹ️ Comandos já registrados para a guilda ${guildId}. Ignorando registro duplicado.`);
    return true;
  }

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
    const commandsData = Array.from(client.commands.values()).map(c => c.data.toJSON());

    Logger.info(`📤 Iniciando registro de ${commandsData.length} comandos na guilda ${guildId}...`);

    // Remove comandos existentes e registra os novos
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commandsData }
    );

    registeredCommandsCache.add(cacheKey);
    Logger.success(`✅ ${commandsData.length} comandos registrados com sucesso na guilda ${guildId}.`);
    return true;
  } catch (error) {
    Logger.error(
      `❌ Erro ao registrar comandos na guilda ${guildId}:`,
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

/**
 * Limpa o cache de comandos registrados.
 */
export function clearCommandsCache(): void {
  registeredCommandsCache.clear();
  Logger.info('ℹ️ Cache de comandos registrados limpo.');
}