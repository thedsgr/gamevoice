import { ensureDBInitialized } from '../utils/db.js';
import db from '../utils/db.js';

async function countRiotIds() {
  await ensureDBInitialized();
  const count = await db('users').whereNotNull('riotId').count('* as count').then((rows) => rows[0].count) || 0;
  console.log(`Atualmente, há ${count} Riot IDs vinculados no banco de dados.`);
}

countRiotIds().catch((error) => {
  console.error('Erro ao contar Riot IDs:', error);
});