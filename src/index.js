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
var dotenv_1 = import("dotenv");
dotenv_1.default.config();
import("colors");
var ExtendedClient_1 = import("./structs/ExtendedClient");
var db_1 = import("./utils/db");
var commandLoader_1 = import("./utils/commandLoader");
var guildMemberAdd_1 = import("./events/guildMemberAdd");
var interactionCreate_1 = import("./events/interactionCreate");
var matchEnd_1 = import("./events/matchEnd");
var voiceStateUpdate_1 = import("./events/voiceStateUpdate");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var client_1, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log("🔄 Inicializando o bot...");
                    // Inicializa o banco de dados
                    console.log("📂 Inicializando o banco de dados...");
                    return [4 /*yield*/, (0, db_1.initDB)()];
                case 1:
                    _a.sent();
                    console.log("✅ Banco de dados inicializado.");
                    client_1 = new ExtendedClient_1.ExtendedClient();
                    // Carrega os comandos
                    console.log("📦 Carregando comandos...");
                    return [4 /*yield*/, (0, commandLoader_1.loadCommands)(client_1)];
                case 2:
                    _a.sent();
                    console.log("\u2705 Comandos carregados: ".concat(client_1.commands.size));
                    // Inicia o bot
                    console.log("🚀 Iniciando o bot...");
                    client_1.start();
                    // Eventos do cliente
                    client_1.on("ready", function () {
                        console.log("✅ Bot online!".green);
                    });
                    client_1.on("matchEnd", matchEnd_1.default);
                    client_1.on("guildMemberAdd", guildMemberAdd_1.default);
                    client_1.on("interactionCreate", function (interaction) { return __awaiter(_this, void 0, void 0, function () {
                        var err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, (0, interactionCreate_1.default)(interaction, client_1)];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_1 = _a.sent();
                                    console.error("❌ Erro no evento interactionCreate:", err_1);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    client_1.on('voiceStateUpdate', function (oldState, newState) {
                        (0, voiceStateUpdate_1.default)(oldState, newState);
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("❌ Erro durante a inicialização do bot:", error_1);
                    process.exit(1); // Encerra o processo em caso de erro crítico
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
main();
