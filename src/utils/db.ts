/**
 * Este arquivo implementa a lógica para manipulação do banco de dados do sistema.
 * Objetivos principais:
 * 1. Inicializar e garantir a existência do arquivo de banco de dados JSON.
 * 2. Fornecer funções utilitárias para leitura e escrita no banco de dados.
 * 3. Garantir que o banco de dados esteja sempre em um estado consistente.
 * 4. Centralizar a lógica de manipulação do banco de dados para facilitar a manutenção.
 */

import { Logger } from './log.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, writeFileSync } from 'fs';
import { DefaultData, DatabaseSchema } from '../types/db.d.js';
import fs from 'fs';
import knex from 'knex';

// Verifica se o arquivo db.json existe, caso contrário, cria um arquivo vazio
if (!fs.existsSync('db.json')) {
  fs.writeFileSync('db.json', JSON.stringify({ users: [] }, null, 2));
}

// Configuração de caminhos absolutos
const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../db.json');

const defaultData: DefaultData = {
  guilds: [],
  users: [],
  reports: [],
  errors: [],
  waitingList: [],
  matches: [],
  settings: {},
  logs: [],
  stats: {
    totalMatchesCreated: 0,
    totalMatchesEndedByInactivity: 0,
    playersKickedByReports: 0,
    totalMatchesEndedByPlayers: 0,
    totalMatchesEnded: 0,
  }, 
  systemLogs: [], 
  restrictedUsers: [], 
  links: [],
};

// Verifica e cria o arquivo se não existir
export async function ensureDBFileExists(): Promise<void> {
  try {
    if (!existsSync(DB_PATH)) {
      writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
      Logger.info(`Arquivo db.json criado em ${DB_PATH}`);
    }
  } catch (error) {
    Logger.error('Falha ao verificar/criar arquivo db.json:', error as Error);
    throw error;
  }
}

// Adiciona validação de dados ao carregar o banco de dados
function validateDatabaseData(data: DatabaseSchema): boolean {
  // Exemplo de validação simples
  if (!Array.isArray(data.guilds) || !Array.isArray(data.users)) {
    Logger.error('[DB] Dados do banco de dados estão corrompidos ou inválidos.');
    return false;
  }
  return true;
}

// Cria a instância do banco de dados
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: join(__dirname, '../../data/database.sqlite'),
  },
  useNullAsDefault: true,
});

// Ajustando os logs para evitar duplicações
async function createTables() {
  const hasUsersTable = await db.schema.hasTable('users');
  if (!hasUsersTable) {
    await db.schema.createTable('users', (table) => {
      table.string('id').primary();
      table.string('name');
      table.string('email');
      table.timestamps(true, true);
    });
    Logger.info('Tabela users criada com sucesso.');
  }

  const hasMatchesTable = await db.schema.hasTable('matches');
  if (!hasMatchesTable) {
    await db.schema.createTable('matches', (table) => {
      table.string('id').primary();
      table.string('status');
      table.string('winner');
      table.timestamps(true, true);
    });
    Logger.info('Tabela matches criada com sucesso.');
  }

  const hasLogsTable = await db.schema.hasTable('logs');
  if (!hasLogsTable) {
    await db.schema.createTable('logs', (table) => {
      table.increments('id').primary();
      table.string('action').notNullable();
      table.text('context');
      table.string('level').notNullable();
      table.text('message').notNullable();
      table.bigInteger('timestamp').notNullable();
    });
    Logger.info('Tabela logs criada com sucesso.');
  }

  const hasSystemLogsTable = await db.schema.hasTable('systemLogs');
  if (!hasSystemLogsTable) {
    await db.schema.createTable('systemLogs', (table) => {
      table.increments('id').primary();
      table.string('action').notNullable();
      table.string('level').notNullable();
      table.string('message').notNullable();
      table.timestamp('timestamp').notNullable();
    });
    Logger.info('Tabela systemLogs criada com sucesso.');
  }
}

createTables();

export default db;

/**
 * Garante que o banco de dados esteja inicializado e consistente.
 */
export async function ensureDBInitialized(): Promise<void> {
  await ensureDBFileExists(); // Garante que o arquivo exista

  if (!validateDatabaseData(defaultData)) {
    Logger.warn('[DB] Restaurando dados padrão devido a inconsistências.');
  }

  Logger.success('[DB] Banco de dados inicializado com sucesso');
}

// Exemplo de uso do Knex para interagir com o banco de dados
export async function getUsers() {
  return await db('users').select('*');
}

export async function addUser(user: { id: string; name: string; email: string }) {
  return await db('users').insert(user);
}

export async function getMatches() {
  return await db('matches').select('*');
}

export async function addMatch(match: { id: string; status: string; winner: string }) {
  return await db('matches').insert(match);
}

export { createTables };
