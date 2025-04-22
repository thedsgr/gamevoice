"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCommands = loadCommands;
// src/utils/commandLoader.ts
var fs_1 = require("fs");
var path_1 = require("path");
var url_1 = require("url");
var path_2 = require("path");
var discord_js_1 = require("discord.js");
require("dotenv/config");
// Recria o comportamento de __dirname
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_2.dirname)(__filename);
/**
 * Carrega todos os comandos do diretório especificado e os registra no cliente.
 * @param client - A instância do cliente estendido.
 */
function loadCommands(client) {
    return __awaiter(this, void 0, void 0, function () {
        // Função recursiva para percorrer subpastas
        function getCommandFiles(dir) {
            var files = fs_1.default.readdirSync(dir, { withFileTypes: true });
            var commandFiles = [];
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                var fullPath = path_1.default.join(dir, file.name);
                if (file.isDirectory()) {
                    // Se for uma subpasta, chama a função recursivamente
                    commandFiles = commandFiles.concat(getCommandFiles(fullPath));
                }
                else if (file.isFile() && file.name.endsWith(extension)) {
                    // Adiciona o arquivo se tiver a extensão correta
                    commandFiles.push(fullPath);
                }
            }
            return commandFiles;
        }
        var commandsPath, extension, commandFiles, _i, commandFiles_1, filePath, command, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    commandsPath = path_1.default.join(__dirname, '../commands');
                    extension = process.env.NODE_ENV === 'production' ? '.js' : '.ts';
                    commandFiles = getCommandFiles(commandsPath);
                    _i = 0, commandFiles_1 = commandFiles;
                    _a.label = 1;
                case 1:
                    if (!(_i < commandFiles_1.length)) return [3 /*break*/, 6];
                    filePath = commandFiles_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, Promise.resolve("".concat(filePath)).then(function (s) { return require(s); })];
                case 3:
                    command = (_a.sent()).default;
                    if (command && command.data && command.execute) {
                        client.commands.set(command.data.name, command);
                        console.log("\u2705 Comando carregado: ".concat(command.data.name));
                    }
                    else {
                        console.warn("\u26A0\uFE0F Arquivo ".concat(filePath, " n\u00E3o \u00E9 um comando v\u00E1lido."));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("\u274C Falha ao importar o comando ".concat(filePath, ":"), error_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log("\uD83D\uDCE6 Total de comandos carregados: ".concat(client.commands.size));
                    return [2 /*return*/];
            }
        });
    });
}
var commands = [
    {
        name: 'startmatch',
        description: 'Inicia uma nova partida.',
    },
];
var rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                console.log('🔄 Registrando comandos...');
                return [4 /*yield*/, rest.put(discord_js_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })];
            case 1:
                _a.sent();
                console.log('✅ Comandos registrados com sucesso!');
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('❌ Erro ao registrar comandos:', error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); })();
