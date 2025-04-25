import { Logger } from '../../../utils/log.js';
export async function applyBan(target, reason) {
    try {
        await target.ban({
            reason: `Banimento permanente: ${reason || 'Infração grave'}`,
            deleteMessageDays: 7 // Apaga mensagens dos últimos 7 dias
        });
        Logger.info(`Usuário ${target.displayName} foi banido. Motivo: ${reason || 'Infração grave'}`, { type: 'BAN' });
        return {
            success: true,
            message: `🔨 ${target.displayName} foi banido permanentemente`,
            duration: -1
        };
    }
    catch (error) {
        console.error('Ban error:', error);
        return {
            success: false,
            message: `❌ Falha ao banir ${target.displayName}`
        };
    }
}
