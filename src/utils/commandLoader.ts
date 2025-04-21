// src/utils/commandLoader.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ExtendedClient } from '../structs/ExtendedClient.js';
import { REST, Routes } from 'discord.js';
import 'dotenv/config';

// Recria o comportamento de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Carrega todos os comandos do diretório especificado e os registra no cliente.
 * @param client - A instância do cliente estendido.
 */
export async function loadCommands(client: ExtendedClient) {
  const commandsPath = path.join(__dirname, '../commands');
  const extension = process.env.NODE_ENV === 'production' ? '.js' : '.ts';

  // Função recursiva para percorrer subpastas
  function getCommandFiles(dir: string): string[] {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let commandFiles: string[] = [];

    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        // Se for uma subpasta, chama a função recursivamente
        commandFiles = commandFiles.concat(getCommandFiles(fullPath));
      } else if (file.isFile() && file.name.endsWith(extension)) {
        // Adiciona o arquivo se tiver a extensão correta
        commandFiles.push(fullPath);
      }
    }

    return commandFiles;
  }

  // Obtém todos os arquivos de comando, incluindo os de subpastas
  const commandFiles = getCommandFiles(commandsPath);

  for (const filePath of commandFiles) {
    try {
      const { default: command } = await import(filePath);

      if (command && command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Comando carregado: ${command.data.name}`);
      } else {
        console.warn(`⚠️ Arquivo ${filePath} não é um comando válido.`);
      }
    } catch (error) {
      console.error(`❌ Falha ao importar o comando ${filePath}:`, error);
    }
  }

  console.log(`📦 Total de comandos carregados: ${client.commands.size}`);
}

const commands = [
  {
    name: 'startmatch',
    description: 'Inicia uma nova partida.',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

(async () => {
  try {
    console.log('🔄 Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
      { body: commands }
    );
    console.log('✅ Comandos registrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();
