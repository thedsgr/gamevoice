import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
import { Collection, Client } from 'discord.js';
import { REST, Routes } from 'discord.js';

interface ExtendedClient extends Client {
  commands: Collection<string, any>;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getCommandFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Diretório não encontrado: ${dir}`);
    return [];
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });
  const extension = process.env.NODE_ENV === 'production' ? '.js' : '.ts';

  return files
    .filter(file => file.isFile() && file.name.endsWith(extension))
    .map(file => path.join(dir, file.name));
}

export async function loadCommands(client: ExtendedClient) {
  client.commands = new Collection();

  const commandsPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../../dist/commands')
    : path.join(__dirname, '../commands');

  const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith(process.env.NODE_ENV === 'production' ? '.js' : '.ts'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const commandUrl = process.env.NODE_ENV === 'production'
        ? pathToFileURL(filePath).href
        : `file://${filePath}`;

      const { default: command } = await import(commandUrl);

      if (command?.data?.name && command?.execute) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Comando carregado: ${command.data.name}`);
      } else {
        console.warn(`⚠️ Comando em ${file} está incompleto ou inválido.`);
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar ${file}:`, error);
    }
  }

  console.log(`📦 Total de comandos carregados: ${client.commands.size}`);
}

export async function registerCommands(client: ExtendedClient) {
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

  try {
    console.log('🔄 Registrando comandos...');

    if (!process.env.CLIENT_ID || !process.env.GUILD_ID) {
      throw new Error('❌ CLIENT_ID ou GUILD_ID não estão definidos no ambiente.');
    }

    const commands = client.commands.map(command => command.data.toJSON());

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
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

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

async function registerInitialCommands() {
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
}

registerInitialCommands();

(async () => {
  try {
    console.log('📦 Carregando comandos...');

    const client: ExtendedClient = new Client({ intents: [] }) as ExtendedClient;
    client.commands = new Collection();

    await loadCommands(client);

    console.log('🔄 Registrando comandos...');
    await registerCommands(client);

    console.log('✅ Comandos carregados e registrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o carregamento ou registro de comandos:', error);
  }
})();