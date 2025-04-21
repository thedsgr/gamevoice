// src/utils/db.ts
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
// configura o adapter para um arquivo JSON
const adapter = new JSONFile('db.json');
// cria a instância do banco
export const db = new Low(adapter, { reports: [], users: [] });
/** Inicializa o banco garantindo arrays vazios */
export async function initDB() {
    await db.read();
    db.data ||= { users: [], reports: [] };
    await db.write();
}
/**
 * Cria ou atualiza um usuário pelo Discord ID.
 */
export async function updateUser({ discordId, riotId, }) {
    const existing = db.data.users.find(u => u.discordId === discordId);
    if (existing) {
        existing.riotId = riotId;
    }
    else {
        db.data.users.push({ discordId, riotId, autoMove: false, activeVoiceChannel: null });
    }
    await db.write();
}
/**
 * Adiciona uma denúncia ao banco, preenchendo o timestamp automaticamente.
 */
export async function addReport({ targetId, reporterId, reason, }) {
    db.data.reports.push({
        targetId,
        reporterId,
        reason,
        timestamp: Date.now(),
    });
    await db.write();
}
//# sourceMappingURL=db.js.map