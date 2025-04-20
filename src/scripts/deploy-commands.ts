const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente.');
  process.exit(1);
}

const commands = loadCommands();
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`🔁 Atualizando ${commands.length} comandos de slash...`);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Comandos registrados com sucesso!');
  } catch (error) {
    console.error('❌ Falha ao registrar comandos:', error);
  }
})();

/**
 * Carrega os comandos do diretório especificado.
 */
function loadCommands() {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'));

  const loadedCommands = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const commandModule = require(filePath);
      const command = commandModule?.default;

      if (command && 'data' in command && 'execute' in command) {
        loadedCommands.push(command.data.toJSON());
      } else {
        console.warn(`[⚠️] Comando ${file} ignorado: está incompleto ou inválido.`);
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar o comando ${file}:`, error);
    }
  }

  return loadedCommands;
}
