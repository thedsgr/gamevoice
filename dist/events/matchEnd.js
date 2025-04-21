// src/events/matchEnd.ts
import { cleanupVoiceChannel } from "../utils/cleanup";
export default async function matchEnd(channel) {
    console.log(`🔔 Partida finalizada — iniciando limpeza do canal: ${channel.name}`);
    try {
        await cleanupVoiceChannel(channel);
        console.log(`✅ Canal ${channel.name} limpo com sucesso.`);
    }
    catch (error) {
        console.error(`❌ Erro ao limpar o canal ${channel.name}:`, error);
    }
}
//# sourceMappingURL=matchEnd.js.map