// Este script registra os comandos de slash no Discord para um servidor específico.
// Ele carrega os comandos localmente, valida sua estrutura e os registra usando a API REST do Discord.

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

// Verifica se as variáveis de ambiente estão configuradas
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente.');
  if (!process.env.DISCORD_TOKEN) console.error('❌ DISCORD_TOKEN está ausente. Verifique o arquivo .env.');
  if (!process.env.CLIENT_ID) console.error('❌ CLIENT_ID está ausente. Verifique o arquivo .env.');
  if (!process.env.GUILD_ID) console.error('❌ GUILD_ID está ausente. Verifique o arquivo .env.');
  process.exit(1);
}

// Configuração do REST com timeout
const rest = new REST({ version: '10', timeout: 15000 }).setToken(process.env.DISCORD_TOKEN!);

/**
 * Obtém todos os arquivos de comando no diretório especificado.
 * @param dir Diretório base para buscar os arquivos.
 * @returns Lista de caminhos para os arquivos de comando.
 */
function getAllCommandFiles(dir: string): string[] {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const extension = process.env.NODE_ENV === 'production' ? '.js' : '.ts';

  const commandFiles: string[] = [];
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      commandFiles.push(...getAllCommandFiles(fullPath));
    } else if (file.isFile() && file.name.endsWith(extension)) {
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
    ? path.join(__dirname, '../../dist/commands')
    : path.join(__dirname, '../commands');

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
        loadedCommands.push(command.data.toJSON());
        console.log(`✅ Comando carregado: ${command.data.name}`);
      } else {
        console.warn(`[⚠️] Comando ${filePath} ignorado: está incompleto ou inválido.`);
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar o comando ${filePath}:`, error);
    }
  }

  return loadedCommands;
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

    console.log(`🔁 Atualizando ${commands.length} comandos de slash...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
      { body: commands }
    );

    console.log('✅ Comandos registrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();
