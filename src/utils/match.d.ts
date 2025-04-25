import { Participant } from "./shared.js";

/**
 * Este arquivo define as interfaces e tipos relacionados ao gerenciamento de partidas no sistema.
 * Ele é usado para padronizar a estrutura de dados de partidas, jogadores e respostas da API,
 * garantindo consistência no projeto.
 * 
 * Funcionalidades principais:
 * - Representar os dados de uma partida, incluindo jogadores e equipes.
 * - Definir a estrutura de partidas ativas e informações detalhadas.
 * - Padronizar a resposta da API para detalhes de partidas.
 */

/** Representa os dados de uma partida */
export interface MatchData {
  matchId: string; // ID único da partida
  teamPlayers: TeamPlayer[]; // Lista de jogadores organizados por equipe
  players: Player[]; // Lista de jogadores na partida
}

/** Representa uma partida ativa */
export interface ActiveMatch {
  teamChannels: string[]; // IDs dos canais das equipes
  players: string[]; // IDs dos jogadores na partida
  checkInterval: NodeJS.Timeout; // Intervalo para verificar a atividade da partida
  matchId: string; // ID único da partida
  timeout: NodeJS.Timeout; // Timeout para encerrar a partida automaticamente
  guildId: string; // ID do servidor (guild)
}

/** Representa as informações de uma partida */
export interface MatchInfo {
  participants: MatchParticipant[]; // Lista de participantes da partida
}

/** Representa a resposta da API para detalhes de uma partida */
export interface MatchResponse {
  metadata: {
    matchId: string; // ID da partida
    participants: string[]; // Lista de PUUIDs dos participantes
  };
  info: MatchInfo; // Informações detalhadas da partida
}

/** Representa uma partida no sistema */
export interface Match extends MatchData {
  guildId: string; // ID do servidor (guild)
  channelId: string; // ID do canal onde a partida está acontecendo
  isActive: boolean; // Indica se a partida está ativa
  lastActivity: number; // Timestamp da última atividade na partida
  startedAt: string; // Timestamp de início da partida
  startedBy: string; // ID do jogador que iniciou a partida
  endedAt?: string; // Timestamp de término da partida (opcional)
  endedBy?: string; // ID do jogador que terminou a partida (opcional)
  id: string; // ID único da partida (UUID)
  players: string[]; // Lista de participantes da partida
}

/** Representa um jogador em uma equipe */
export interface TeamPlayer {
  puuid: string; // ID único do jogador na Riot
  riotName: string; // Nome do jogador na Riot
  discordId: string; // ID do jogador no Discord
  team?: string; // Nome ou número da equipe
  role?: string; // Função do jogador na equipe (ex.: capitão, suporte)
}