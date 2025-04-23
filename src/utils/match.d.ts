export interface MatchData {
  matchId: string;
  teamPlayers: TeamPlayer[];
  players: Player[];
}

export interface ActiveMatch {
  players: Player[];
  matchId: string;
}

/** Representa uma partida no sistema */
export interface Match {
  id: string;
  guildId: string;
  channelId: string;
  waitingChannelId?: string;
  isActive: boolean;
  lastActivity: number;
  players: string[];
  startedAt: string;
  startedBy: string;
  endedAt?: string;
  endedBy?: string;
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

/** Representa uma partida ativa */
export interface ActiveMatch {
  players: Player[];
  matchId: string;
}