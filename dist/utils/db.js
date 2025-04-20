"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initDB = initDB;
exports.updateUser = updateUser;
exports.addReport = addReport;
// src/utils/db.ts
const lowdb_1 = require("lowdb");
const node_1 = require("lowdb/node");
// configura o adapter para um arquivo JSON
const adapter = new node_1.JSONFile('db.json');
// cria a instância do banco
exports.db = new lowdb_1.Low(adapter, { reports: [], users: [] });
/** Inicializa o banco garantindo arrays vazios */
async function initDB() {
    await exports.db.read();
    exports.db.data || (exports.db.data = { users: [], reports: [] });
    await exports.db.write();
}
/**
 * Cria ou atualiza um usuário pelo Discord ID.
 */
async function updateUser({ discordId, riotId, }) {
    const existing = exports.db.data.users.find(u => u.discordId === discordId);
    if (existing) {
        existing.riotId = riotId;
    }
    else {
        exports.db.data.users.push({ discordId, riotId, autoMove: false, activeVoiceChannel: null });
    }
    await exports.db.write();
}
/**
 * Adiciona uma denúncia ao banco, preenchendo o timestamp automaticamente.
 */
async function addReport({ targetId, reporterId, reason, }) {
    exports.db.data.reports.push({
        targetId,
        reporterId,
        reason,
        timestamp: Date.now(),
    });
    await exports.db.write();
}
//# sourceMappingURL=db.js.map