import { db } from "../utils/db.js";
export default async function guildMemberAdd(member) {
    try {
        // Garante que o banco de dados está inicializado
        if (!db.data) {
            throw new Error("O banco de dados não foi inicializado.");
        }
        // Verifica se o usuário já existe no banco de dados
        const exists = db.data.users.some(u => u.discordId === member.id);
        if (!exists) {
            db.data.users.push({ discordId: member.id });
            await db.write();
            console.log(`👤 Novo usuário salvo no banco: ${member.user.username}`);
        }
        // Envia DM de boas-vindas
        await sendWelcomeMessage(member);
    }
    catch (error) {
        console.error(`❌ Erro ao processar o evento guildMemberAdd para ${member.user.username}:`, error);
    }
}
/**
 * Envia uma mensagem de boas-vindas ao membro.
 */
async function sendWelcomeMessage(member) {
    try {
        await member.send({
            content: `👋 Fala, ${member.user.username}! Bem-vindo ao servidor!  
Para usar o Game Voice, conecte sua conta da Riot aqui: [https://login.gamevoice.gg](https://login.gamevoice.gg) 🎮🔗`
        });
        console.log(`📩 Mensagem de boas-vindas enviada para ${member.user.username}`);
    }
    catch (error) {
        console.error(`❌ Não foi possível enviar DM para ${member.user.username}:`, error);
    }
}
//# sourceMappingURL=guildMemberAdd.js.map