import { db } from '../utils/db.js';
import { logToConsole } from '../utils/log.js';

/**
 * Cria uma nova partida.
 */
export async function createMatch(channelId: string, players: string[]): Promise<string> {
  logToConsole(`Criando partida para o canal ${channelId} com jogadores: ${players.join(', ')}`, 'INFO');
  // Valida se o channelId foi fornecido
  if (!channelId) {
    throw new Error("O ID do canal não pode estar vazio.");
  }

  // Verifica se já existe uma partida ativa para o canal
  const existingMatch = db.data!.matches.find((m) => m.channelId === channelId && m.isActive);
  if (existingMatch) {
    throw new Error(`Já existe uma partida ativa para o canal ${channelId}.`);
  }

  // Valida se o array de players não está vazio
  if (!players || players.length === 0) {
    throw new Error("A lista de jogadores não pode estar vazia.");
  }

  // Opcional: Limite de jogadores
  const MAX_PLAYERS = 10;
  if (players.length > MAX_PLAYERS) {
    throw new Error(`O número máximo de jogadores por partida é ${MAX_PLAYERS}.`);
  }

  // Cria a partida
  const matchId = generateMatchId();
  db.data!.matches.push({
    id: matchId,
    channelId,
    isActive: true,
    lastActivity: Date.now(),
    players,
  });
  db.data!.stats.totalMatchesCreated += 1;
  await db.write();
  return matchId;
}

/**
 * Encerra uma partida existente.
 * @param matchId - O ID da partida a ser encerrada.
 */
export async function endMatch(matchId: string): Promise<void> {
  // Valida se o matchId foi fornecido
  if (!matchId) {
    throw new Error("O ID da partida não pode estar vazio.");
  }

  // Busca a partida no banco de dados
  const matchIndex = db.data!.matches.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) {
    throw new Error(`Partida com ID ${matchId} não encontrada.`);
  }

  const match = db.data!.matches[matchIndex];

  // Verifica se a partida já foi encerrada
  if (!match.isActive) {
    throw new Error(`A partida com ID ${matchId} já foi encerrada.`);
  }

  // Remove a partida do banco de dados
  db.data!.matches.splice(matchIndex, 1);
  db.data!.stats.totalMatchesEndedByInactivity += 1;
  await db.write();
}

/**
 * Atualiza o timestamp de última atividade de uma partida.
 */
export async function updateMatchActivity(matchId: string): Promise<void> {
  // Valida se o matchId foi fornecido
  if (!matchId) {
    throw new Error("O ID da partida não pode estar vazio.");
  }

  // Busca a partida no banco de dados
  const match = db.data!.matches.find((m) => m.id === matchId);
  if (!match) {
    throw new Error(`Partida com ID ${matchId} não encontrada.`);
  }

  // Verifica se a partida está ativa
  if (!match.isActive) {
    throw new Error(`A partida com ID ${matchId} não está ativa.`);
  }

  // Atualiza o timestamp de última atividade
  match.lastActivity = Date.now();
  await db.write();
}

/**
 * Busca uma partida pelo ID.
 * @param matchId - O ID da partida.
 * @returns A partida encontrada ou null.
 */
export function getMatchById(matchId: string) {
  if (!matchId) {
    throw new Error("O ID da partida não pode estar vazio.");
  }

  return db.data!.matches.find((m) => m.id === matchId) || null;
}

/**
 * Gera um ID único para uma partida.
 */
function generateMatchId(): string {
  return Math.random().toString(36).substring(2, 15);
}