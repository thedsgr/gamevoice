/** Representa os dados de uma partida */
export interface MatchData {
  matchId: string;
  teamPlayers: TeamPlayer[];
  players: Player[];
}

/** Representa uma partida ativa */
export interface ActiveMatch {
  players: Player[];
  matchId: string;
}

/** Representa um participante de uma partida */
export interface MatchParticipant {
  puuid: string; // Identificador único do jogador (PUUID)
  teamId: number; // ID da equipe
  summonerName: string; // Nome do invocador
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
export interface Match {
  id: string; // ID único da partida
  guildId: string; // ID do servidor (guild)
  channelId: string; // ID do canal onde a partida está acontecendo
  waitingChannelId?: string; // ID do canal de espera (opcional)
  isActive: boolean; // Indica se a partida está ativa
  lastActivity: number; // Timestamp da última atividade na partida
  players: string[]; // Lista de IDs dos jogadores na partida
  startedAt: string; // Timestamp de início da partida
  startedBy: string; // ID do jogador que iniciou a partida
  endedAt?: string; // Timestamp de término da partida (opcional)
  endedBy?: string; // ID do jogador que terminou a partida (opcional)
}

/** Representa os dados de uma equipe em uma partida */
export interface TeamData {
  matchId: string;
  teamPlayers: TeamPlayers[];
}

/** Representa um jogador em uma equipe */
export interface TeamPlayers {
  puuid: string;
  riotName: string;
  discordId?: string;
  team?: string;
}