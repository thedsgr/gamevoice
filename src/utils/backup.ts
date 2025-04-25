/**
 * Este arquivo contém funções utilitárias para interagir com a API da Riot Games.
 * Ele fornece métodos para buscar informações de contas, partidas ativas, times,
 * monitorar a saúde da API e tratar erros de forma centralizada.
 * 
 * Funcionalidades principais:
 * - Comunicação com a API da Riot usando Axios.
 * - Tratamento de erros com suporte a erros críticos e não críticos.
 * - Monitoramento de partidas ativas e organização de jogadores.
 * - Controle de taxa de requisições (Rate Limiting) e cache (se implementado).
 */

import fs from 'fs/promises';
import path from 'path';
import { riotClient } from './httpClient.js';
import axios from 'axios';
import { fetchActiveGame } from '../utils/riotAPI.js';
import { Logger } from './log.js';

const BACKUP_DIR = './backup';
const DB_FILE = './db.json';

/**
 * Cria um backup do arquivo de banco de dados.
 */
export async function createBackup(): Promise<void> {
  try {
    // Verifica se o arquivo de banco de dados existe
    const dbExists = await fs.stat(DB_FILE).then(() => true).catch(() => false);
    if (!dbExists) {
      console.warn("⚠️ Arquivo de banco de dados não encontrado. Backup não será criado.");
      return;
    }

    // Cria o diretório de backup, se não existir
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // Gera o nome do arquivo de backup com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `db-backup-${timestamp}.json`;

    // Copia o arquivo de banco de dados para o diretório de backup
    await fs.copyFile(DB_FILE, path.join(BACKUP_DIR, backupName));
    console.log("🗂️ Backup criado com sucesso:", backupName);
  } catch (err) {
    console.error("❌ Erro ao criar backup:", err);
  }
}

/**
 * Verifica a saúde da API da Riot
 */
export async function checkRiotAPIHealth(): Promise<boolean> {
    try {
        const response = await riotClient.get('https://americas.api.riotgames.com/lol/status/v1/shard-data');
        return response.status === 200;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            Logger.error(
                'Erro do Axios ao verificar a saúde da API da Riot',
                new Error(String(error.response?.data || error.message))
            );
        } else if (error instanceof Error) {
            Logger.error('Erro desconhecido ao verificar a saúde da API da Riot', error);
        } else {
            Logger.error('Erro desconhecido ao verificar a saúde da API da Riot', new Error(String(error)));
        }
        return false;
    }
}

/**
 * Monitoramento otimizado de partidas
 */
export async function monitorActiveGames(guildId: string, playerIds: string[]): Promise<{
    gameId: number;
    players: string[];
    teamId: number | null;
}[]> {
    try {
        const activeGames = new Map<number, string[]>();

        for (const playerId of playerIds) {
            const game = await fetchActiveGame(playerId, guildId);
            if (game) {
                const players = activeGames.get(game.gameId) || [];
                activeGames.set(game.gameId, [...players, playerId]);
            }
        }

        if (activeGames.size === 0) {
            Logger.info('Nenhuma partida ativa encontrada.');
            return [];
        }

        return Array.from(activeGames.entries()).map(([gameId, players]) => ({
            gameId,
            players,
            teamId: players.length > 1 ? 100 : null, // Time azul se houver múltiplos jogadores
        }));
    } catch (error) {
        Logger.error('Falha no monitoramento de partidas', error instanceof Error ? error : new Error(String(error)));
        return [];
    }
}
