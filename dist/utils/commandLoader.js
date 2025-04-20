"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCommands = loadCommands;
const tslib_1 = require("tslib");
// src/utils/commandLoader.ts
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
/**
 * Carrega todos os comandos do diretório especificado e os registra no cliente.
 * @param client - A instância do cliente estendido.
 */
async function loadCommands(client) {
    const commandsPath = path_1.default.join(__dirname, '../commands');
    const extension = process.env.NODE_ENV === 'production' ? '.js' : '.ts';
    // Filtra os arquivos de comando com a extensão correta
    const commandFiles = fs_1.default
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(extension) && file !== `SlashCommand${extension}`);
    for (const file of commandFiles) {
        const filePath = path_1.default.resolve(commandsPath, file);
        try {
            const { default: command } = await Promise.resolve(`${filePath}`).then(s => tslib_1.__importStar(require(s)));
            if (command && command.data && command.execute) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Comando carregado: ${command.data.name}`);
            }
            else {
                console.warn(`⚠️ Arquivo ${file} não é um comando válido.`);
            }
        }
        catch (error) {
            console.error(`❌ Falha ao importar o comando ${file}:`, error);
        }
    }
    console.log(`📦 Total de comandos carregados: ${client.commands.size}`);
}
//# sourceMappingURL=commandLoader.js.map