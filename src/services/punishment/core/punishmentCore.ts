import { GuildMember } from 'discord.js';
import { db, ensureDBInitialized } from '../../../utils/db.js';

export class PunishmentCore {
  /** Obtém o número de relatórios recentes de um usuário em um intervalo de tempo */
  static async getRecentReports(userId: string, timeframe = 86400000): Promise<number> {
    ensureDBInitialized();

    const now = Date.now();
    return db.data!.reports.filter(
      (r: { targetId: string; timestamp: number }) => r.targetId === userId && (now - r.timestamp) < timeframe
    ).length;
  }

  /** Registra um novo relatório no banco de dados */
  static async registerReport(
    targetId: string,
    reporterId: string,
    reason: string
  ): Promise<void> {
    ensureDBInitialized();

    if (!targetId || !reporterId || !reason) {
      throw new Error('Todos os parâmetros (targetId, reporterId, reason) são obrigatórios.');
    }

    db.data!.reports.push({
      targetId,
      reporterId,
      reason,
      timestamp: Date.now(),
    });

    await db.write();
  }

  /** Verifica se um usuário atende às condições para ser banido */
  static async checkBanConditions(target: GuildMember): Promise<boolean> {
    ensureDBInitialized();

    const user = db.data!.users.find((u: { discordId: string }) => u.discordId === target.id);
    return (user?.severeOffenses || 0) >= 1;
  }
}