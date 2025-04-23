import { db, ensureDBInitialized } from '../../../utils/db.js';
export class PunishmentCore {
    /** Obtém o número de relatórios recentes de um usuário em um intervalo de tempo */
    static async getRecentReports(userId, timeframe = 86400000) {
        ensureDBInitialized();
        const now = Date.now();
        return db.data.reports.filter((r) => r.targetId === userId && (now - r.timestamp) < timeframe).length;
    }
    /** Registra um novo relatório no banco de dados */
    static async registerReport(targetId, reporterId, reason) {
        ensureDBInitialized();
        if (!targetId || !reporterId || !reason) {
            throw new Error('Todos os parâmetros (targetId, reporterId, reason) são obrigatórios.');
        }
        db.data.reports.push({
            targetId,
            reporterId,
            reason,
            timestamp: Date.now(),
        });
        await db.write();
    }
    /** Verifica se um usuário atende às condições para ser banido */
    static async checkBanConditions(target) {
        ensureDBInitialized();
        const user = db.data.users.find((u) => u.discordId === target.id);
        return (user?.severeOffenses || 0) >= 1;
    }
}
