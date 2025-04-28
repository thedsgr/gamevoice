var _a;
import { applyVoiceMute } from '../actions/voiceMute.js';
import { applyCommandRestriction } from '../actions/commandRestriction.js';
import { applyBan } from '../actions/banAction.js';
import { PunishmentCore } from './punishmentCore.js';
import { sendLog } from '../../../utils/log.js';
import { sendWarningDM } from '../../../utils/warningDm.js';
export class PunishmentManager {
    static async handleReport(options) {
        const { target, reporter, reason, client } = options;
        try {
            // Implementação do tratamento do report
            await PunishmentCore.registerReport(target.id, reporter.id, reason);
            const targetId = target.id; // Extrai o ID do GuildMember
            if (await PunishmentCore.checkBanConditions(targetId)) {
                const result = await applyBan(target, 'Infração grave');
                if (client) {
                    await sendLog(client, `Ban imediato aplicado: ${target.user.tag} | Motivo: Infração grave`, 'MOD');
                }
                return result;
            }
            const reportCount = await PunishmentCore.getRecentReports(target.id);
            for (let stageIndex = 0; stageIndex < this.STAGES.length; stageIndex++) {
                const stage = this.STAGES[stageIndex];
                if (reportCount >= stage.threshold) {
                    const result = await stage.action(target, reason, client);
                    if (client) {
                        await sendLog(client, `Report processado: ${target.user.tag} | Estágio ${stageIndex + 1} | Resultado: ${result.success ? '✅' : '❌'}`, 'MOD');
                    }
                    return result;
                }
            }
            if (client) {
                await sendLog(client, `Report registrado: ${target.user.tag} | Motivo: ${reason}`, 'MOD');
            }
            return {
                success: true,
                message: `📝 Report contra ${target.displayName} registrado`,
            };
        }
        catch (error) {
            console.error('❌ Erro ao processar report:', error);
            return {
                success: false,
                message: '❌ Erro ao processar report',
            };
        }
    }
}
_a = PunishmentManager;
PunishmentManager.STAGES = [
    {
        threshold: 3,
        action: async (target) => {
            await sendWarningDM(target); // Agora usando a função importada
            return {
                success: true,
                message: `⚠️ ${target.displayName} recebeu um aviso formal`,
            };
        },
    },
    {
        threshold: 6,
        action: (target, reason, client) => applyVoiceMute(target, 900000, reason, client),
    },
    {
        threshold: 10,
        action: (target, reason, client) => applyCommandRestriction(target, 86400000, reason, client),
    },
    {
        threshold: 20,
        action: (target, reason, client) => applyBan(target, reason),
    },
];
