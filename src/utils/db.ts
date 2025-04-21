// src/utils/db.ts
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

/** Dados de usuário */
export type UserData = {
  discordId: string;
  riotId?: string;
  autoMove?: boolean;
  activeVoiceChannel?: string | null;
  lastInteraction?: number;
};

/** Cada denúncia feita */
export interface Report {
  targetId: string;
  reporterId: string;
  reason: string;
  timestamp: number;
}

/** Estrutura do JSON */
export interface DatabaseSchema {
  users: UserData[];
  reports: Report[];
  matches: { isActive: boolean; players: string[] }[];
  errors: { timestamp: number; message: string }[];
  stats: {
    totalMatchesCreated: number;
    totalMatchesEndedByInactivity: number;
    playersKickedByReports: number;
  };
  activeVoiceChannel?: string;
  waitingRoomChannelId?: string;
  logChannelId?: string;
}

// Configura o adapter para um arquivo JSON
const adapter = new JSONFile<DatabaseSchema>('db.json');
// Cria a instância do banco
export const db = new Low(adapter, {
  users: [
    { discordId: '123', riotId: 'Player#1234', lastInteraction: 1680000000000 },
    // ...
  ],
  stats: {
    totalMatchesCreated: 83,
    totalMatchesEndedByInactivity: 19,
    playersKickedByReports: 3,
  },
  reports: [
    { targetId: '456', reporterId: '123', reason: 'toxicidade', timestamp: 1680000000000 },
    // ...
  ],
  matches: [
    { isActive: true, players: ['123', '456'] },
    // ...
  ],
  errors: [
    { timestamp: 1680000000000, message: 'Falha ao mover Fulano (DM bloqueada)' },
    // ...
  ],
});

/** Função utilitária para garantir que o banco está inicializado */
function ensureDBInitialized() {
  if (!db.data) {
    throw new Error("❌ Banco de dados não inicializado.");
  }
}

/** Função utilitária para logs */
function log(message: string) {
  console.log(`[DB] ${message}`);
}

/** Inicializa o banco garantindo arrays vazios */
export async function initDB() {
  log("Inicializando o banco de dados...");
  await db.read();
  db.data ||= {
    users: [],
    reports: [],
    matches: [],
    errors: [],
    stats: {
      totalMatchesCreated: 0,
      totalMatchesEndedByInactivity: 0,
      playersKickedByReports: 0,
    },
  };
  await db.write();
  log("Banco de dados inicializado com sucesso.");
}

/** Cria ou atualiza um usuário pelo Discord ID */
export async function updateUser({
  discordId,
  riotId,
}: {
  discordId: string;
  riotId: string | null;
}) {
  ensureDBInitialized();

  const existingUser = db.data!.users.find(user => user.discordId === discordId);
  if (existingUser) {
    existingUser.riotId = riotId ?? undefined; // Converte null para undefined
  } else {
    db.data!.users.push({ discordId, riotId: riotId ?? undefined }); // Converte null para undefined
  }

  await db.write();
}

/** Adiciona uma denúncia ao banco, preenchendo o timestamp automaticamente */
export async function addReport({
  targetId,
  reporterId,
  reason,
}: Readonly<{
  targetId: string;
  reporterId: string;
  reason: string;
}>) {
  ensureDBInitialized();
  log(`Adicionando denúncia: targetId=${targetId}, reporterId=${reporterId}, reason=${reason}`);

  db.data!.reports.push({
    targetId,
    reporterId,
    reason,
    timestamp: Date.now(),
  });

  await db.write();
  log(`Denúncia registrada com sucesso: targetId=${targetId}`);
}

/** Função para logar o comando de fim de partida */
export function logEndMatchCommand(interaction: { user: { tag: string; id: string } }) {
  log(`🔒 Comando /endmatch executado por ${interaction.user.tag} (${interaction.user.id})`);
}
