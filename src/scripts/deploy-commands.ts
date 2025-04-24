import { REST, Routes, ChatInputCommandInteraction } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import { loadCommands } from '../utils/commandLoader.js';
import { ExtendedClient } from '../structs/ExtendedClient.js';
import 'dotenv/config';

// Recria o comportamento de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente.');
  if (!process.env.DISCORD_TOKEN) console.error('❌ DISCORD_TOKEN está ausente. Verifique o arquivo .env.');
  if (!process.env.CLIENT_ID) console.error('❌ CLIENT_ID está ausente. Verifique o arquivo .env.');
  if (!process.env.GUILD_ID) console.error('❌ GUILD_ID está ausente. Verifique o arquivo .env.');
  process.exit(1);
}

// Configuração do REST com timeout
const REST_CONFIG = { 
  version: '10',
  timeout: 15000 // Timeout aumentado para 15 segundos
};

const rest = new REST(REST_CONFIG).setToken(process.env.DISCORD_TOKEN!);

// Inicializa o cliente estendido
const client = new ExtendedClient({
  intents: [], // Add the required intents here
}) as ExtendedClient;

function getAllCommandFiles(dir: string): string[] {
  console.log(`📂 Verificando diretório: ${dir}`);
  const files = fs.readdirSync(dir, { withFileTypes: true });
  console.log(`📂 Arquivos encontrados: ${files.map(file => file.name)}`);
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

async function loadCommandsLocally() {
  const commandsPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../../dist/commands')
    : path.join(__dirname, '../commands');

  console.log(`🔄 Ambiente de execução: ${process.env.NODE_ENV}`);
  console.log(`📂 Diretório de comandos: ${commandsPath}`);

  const commandFiles = getAllCommandFiles(commandsPath);

  if (commandFiles.length === 0) {
    console.warn('⚠️ Nenhum arquivo de comando encontrado no diretório:', commandsPath);
    return [];
  }

  console.log(`📂 Arquivos encontrados no diretório de comandos:`);
  console.log(commandFiles);

  const loadedCommands = [];

  for (const filePath of commandFiles) {
    try {
      const commandModule = await import(pathToFileURL(filePath).href);
      const command = commandModule?.default;
      console.log('🔍 Comando encontrado:', command);

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

  console.log(`📦 Total de comandos carregados: ${loadedCommands.length}`);
  return loadedCommands;
}

(async () => {
  try {
    console.log('📂 Carregando comandos...');
    const commands = await loadCommandsLocally();

    if (commands.length === 0) {
      console.warn('⚠️ Nenhum comando carregado. O registro de comandos será ignorado.');
      return;
    }

    console.log(`✅ ${commands.length} comandos carregados.`);

    try {
      console.log(`🔁 Atualizando ${commands.length} comandos de slash...`);

      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID!,
          process.env.GUILD_ID!
        ),
        { body: commands }
      );

      console.log('✅ Comandos registrados com sucesso!');
    } catch (error) {
      console.error('❌ Falha ao registrar comandos:', error);
      if (error instanceof Error && 'rawError' in error) {
        console.error('Detalhes do erro:', (error as any).rawError);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar comandos:', error);
  }
})();
