// src/utils/db.ts
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
// Configura o adapter para um arquivo JSON
const adapter = new JSONFile('db.json');
// Cria a instância do banco
export const db = new Low(adapter, { reports: [], users: [] });
/** Função utilitária para garantir que o banco está inicializado */
function ensureDBInitialized() {
    if (!db.data) {
        throw new Error("❌ Banco de dados não inicializado.");
    }
}
/** Função utilitária para logs */
function log(message) {
    console.log(`[DB] ${message}`);
}
/** Inicializa o banco garantindo arrays vazios */
export async function initDB() {
    log("Inicializando o banco de dados...");
    await db.read();
    db.data ||= { users: [], reports: [] };
    await db.write();
    log("Banco de dados inicializado com sucesso.");
}
/** Cria ou atualiza um usuário pelo Discord ID */
export async function updateUser({ discordId, riotId, }) {
    ensureDBInitialized();
    log(`Atualizando usuário: discordId=${discordId}, riotId=${riotId}`);
    const existing = db.data.users.find(u => u.discordId === discordId);
    if (existing) {
        log(`Usuário existente encontrado: ${discordId}. Atualizando Riot ID.`);
        existing.riotId = riotId;
    }
    else {
        log(`Criando novo usuário: ${discordId}`);
        db.data.users.push({ discordId, riotId, autoMove: false, activeVoiceChannel: null });
    }
    await db.write();
    log(`Usuário atualizado com sucesso: ${discordId}`);
}
/** Adiciona uma denúncia ao banco, preenchendo o timestamp automaticamente */
export async function addReport({ targetId, reporterId, reason, }) {
    ensureDBInitialized();
    log(`Adicionando denúncia: targetId=${targetId}, reporterId=${reporterId}, reason=${reason}`);
    db.data.reports.push({
        targetId,
        reporterId,
        reason,
        timestamp: Date.now(),
    });
    await db.write();
    log(`Denúncia registrada com sucesso: targetId=${targetId}`);
}
/** Função para logar o comando de fim de partida */
export function logEndMatchCommand(interaction) {
    log(`🔒 Comando /endmatch executado por ${interaction.user.tag} (${interaction.user.id})`);
}
//# sourceMappingURL=db.js.map