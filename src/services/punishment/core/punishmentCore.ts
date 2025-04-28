// PunishmentCore: Gerencia punições no sistema, incluindo relatórios e condições de banimento.
// Funções principais:
// - getRecentReports: Obtém relatórios recentes de um usuário.
// - registerReport: Registra um novo relatório contra um usuário.
// - checkBanConditions: Verifica se um usuário atende às condições de banimento.

// Importação do banco de dados
import db from '../../../utils/db.js';

export class PunishmentCore {
  // Obtém o número de relatórios recentes de um usuário dentro de um período de tempo especificado.
  static async getRecentReports(userId: string, timeframe = 86400000): Promise<number> {
    try {
      const now = Date.now();
      const reports = await db('reports')
        .where('targetId', userId)
        .andWhere('timestamp', '>', now - timeframe);
      return reports.length;
    } catch (error) {
      console.error(`Erro ao buscar relatórios recentes para o usuário ${userId}:`, error);
      throw new Error('Não foi possível buscar os relatórios recentes.');
    }
  }

  // Registra um novo relatório contra um usuário, incluindo o ID do alvo, do repórter e a razão.
  static async registerReport(targetId: string, reporterId: string, reason: string): Promise<void> {
    if (!targetId || !reporterId || !reason) {
      throw new Error('Todos os parâmetros (targetId, reporterId, reason) são obrigatórios.');
    }

    if (typeof targetId !== 'string' || typeof reporterId !== 'string' || typeof reason !== 'string') {
      throw new Error('Os parâmetros targetId, reporterId e reason devem ser strings.');
    }

    try {
      await db('reports').insert({
        targetId,
        reporterId,
        reason,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`Erro ao registrar relatório para o usuário ${targetId}:`, error);
      throw new Error('Não foi possível registrar o relatório.');
    }
  }

  // Verifica se um usuário atende às condições de banimento e retorna informações detalhadas.
  static async checkBanConditions(targetId: string): Promise<{ isBanned: boolean; reason?: string }> {
    try {
      const user = await db('users').where({ userId: targetId }).first();
      if (!user) {
        return { isBanned: false };
      }
      return { isBanned: true, reason: 'Usuário encontrado no banco de dados.' };
    } catch (error) {
      console.error(`Erro ao verificar condições de banimento para o usuário ${targetId}:`, error);
      throw new Error('Não foi possível verificar as condições de banimento.');
    }
  }
}