import { db } from '@utils/db.js';
export class PunishmentCore {
    static async getRecentReports(userId, timeframe = 86400000) {
        const now = Date.now();
        return db.data?.reports.filter(r => r.targetId === userId &&
            (now - r.timestamp) < timeframe).length || 0;
    }
    static async registerReport(targetId, reporterId, reason) {
        await db.update(({ reports }) => {
            reports.push({
                targetId,
                reporterId,
                reason,
                timestamp: Date.now()
            });
        });
    }
    static async checkBanConditions(target) {
        const user = db.data?.users.find(u => u.discordId === target.id);
        return (user?.severeOffenses || 0) >= 1;
    }
}
