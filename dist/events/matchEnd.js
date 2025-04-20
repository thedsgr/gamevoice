"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = matchEnd;
// src/events/matchEnd.ts
const cleanup_1 = require("../utils/cleanup");
async function matchEnd(channel) {
    console.log(`🔔 Partida finalizada — iniciando limpeza do canal: ${channel.name}`);
    try {
        await (0, cleanup_1.cleanupVoiceChannel)(channel);
        console.log(`✅ Canal ${channel.name} limpo com sucesso.`);
    }
    catch (error) {
        console.error(`❌ Erro ao limpar o canal ${channel.name}:`, error);
    }
}
//# sourceMappingURL=matchEnd.js.map