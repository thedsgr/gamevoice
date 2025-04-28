import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from '../utils/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  try {
    const dbJsonPath = join(__dirname, '../../db.json');
    const rawData = readFileSync(dbJsonPath, 'utf-8');
    const jsonData = JSON.parse(rawData);

    // Verificar e criar tabela logs, se não existir
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
      console.log('Tabela logs criada com sucesso.');
    }

    // Adicionar coluna riotId à tabela users, se não existir
    const hasRiotIdColumn = await db.schema.hasColumn('users', 'riotId');
    if (!hasRiotIdColumn) {
      await db.schema.table('users', (table) => {
        table.string('riotId').nullable();
      });
      console.log('Coluna riotId adicionada à tabela users.');
    }

    // Adicionar coluna userId à tabela users, se não existir
    const hasUserIdColumn = await db.schema.hasColumn('users', 'userId');
    if (!hasUserIdColumn) {
      await db.schema.table('users', (table) => {
        table.string('userId').nullable();
      });
      console.log('Coluna userId adicionada à tabela users.');
    }

    // Adicionar coluna reason à tabela systemLogs, se não existir
    const hasReasonColumn = await db.schema.hasColumn('systemLogs', 'reason');
    if (!hasReasonColumn) {
      await db.schema.table('systemLogs', (table) => {
        table.text('reason').nullable();
      });
      console.log('Coluna reason adicionada à tabela systemLogs.');
    }

    // Adicionar coluna type à tabela systemLogs, se não existir
    const hasTypeColumn = await db.schema.hasColumn('systemLogs', 'type');
    if (!hasTypeColumn) {
      await db.schema.table('systemLogs', (table) => {
        table.string('type').nullable();
      });
      console.log('Coluna type adicionada à tabela systemLogs.');
    }

    // Migrar usuários
    if (jsonData.users && Array.isArray(jsonData.users)) {
      for (const user of jsonData.users) {
        await db('users').insert(user);
      }
    }

    // Migrar partidas
    if (jsonData.matches && Array.isArray(jsonData.matches)) {
      for (const match of jsonData.matches) {
        await db('matches').insert(match);
      }
    }

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await db.destroy();
  }
}

migrate();