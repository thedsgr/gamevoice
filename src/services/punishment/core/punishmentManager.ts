import { Client, GuildMember } from 'discord.js';
import { PunishmentAction, PunishmentResult } from '../types/punishmentTypes.js';
import { applyVoiceMute } from '../actions/voiceMute.js';
import { applyCommandRestriction } from '../actions/commandRestriction.js';
import { applyBan } from '../actions/banAction.js';
import { PunishmentCore } from './punishmentCore.js';
import { sendLog } from '../../../utils/log.js';
import { sendWarningDM } from '../../../utils/warningDm.js';

export class PunishmentManager {
  private static readonly STAGES = [
    {
      threshold: 3,
      action: async (target: GuildMember) => {
        await sendWarningDM(target); // Agora usando a função importada
        return {
          success: true,
          message: `⚠️ ${target.displayName} recebeu um aviso formal`,
        };
      },
    },
    {
      threshold: 6,
      action: (target: GuildMember, reason: string, client?: Client) =>
        applyVoiceMute(target, 900000, reason, client),
    },
    {
      threshold: 10,
      action: (target: GuildMember, reason: string, client?: Client) =>
        applyCommandRestriction(target, 86400000, reason, client),
    },
    {
      threshold: 20,
      action: (target: GuildMember, reason: string, client?: Client) =>
        applyBan(target, reason),
    },
  ];

  public static async handleReport(
    target: GuildMember,
    reporter: GuildMember,
    reason: string,
    client?: Client
  ): Promise<PunishmentResult> {
    try {
      // 1. Registrar report
      await PunishmentCore.registerReport(target.id, reporter.id, reason);

      // 2. Verificar condições para ban imediato
      if (await PunishmentCore.checkBanConditions(target)) {
        const result = await applyBan(target, 'Infração grave');
        if (client) {
          await sendLog(
            client,
            `Ban imediato aplicado: ${target.user.tag} | Motivo: Infração grave`,
            'MOD'
          );
        }
        return result;
      }

      // 3. Verificar contagem de reports
      const reportCount = await PunishmentCore.getRecentReports(target.id);

      // 4. Aplicar punição correspondente
      for (let stageIndex = 0; stageIndex < this.STAGES.length; stageIndex++) {
        const stage = this.STAGES[stageIndex];
        if (reportCount >= stage.threshold) {
          const result = await stage.action(target, reason, client);

          // Log adicional
          if (client) {
            await sendLog(
              client,
              `Report processado: ${target.user.tag} | Estágio ${stageIndex + 1} | Resultado: ${
                result.success ? '✅' : '❌'
              }`,
              'MOD'
            );
          }

          return result;
        }
      }

      // 5. Nenhuma punição aplicada, apenas registrar o report
      if (client) {
        await sendLog(
          client,
          `Report registrado: ${target.user.tag} | Motivo: ${reason}`,
          'MOD'
        );
      }

      return {
        success: true,
        message: `📝 Report contra ${target.displayName} registrado`,
      };
    } catch (error) {
      console.error('❌ Erro ao processar report:', error);
      return {
        success: false,
        message: '❌ Erro ao processar report',
      };
    }
  }
}