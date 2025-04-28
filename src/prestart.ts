/**
 * Este arquivo realiza a pré-inicialização do ambiente necessário para o funcionamento do bot.
 * Ele verifica se o arquivo de banco de dados (db.json) existe e, caso não exista, cria o arquivo
 * com uma estrutura inicial padrão. Além disso, ele registra logs para indicar o sucesso ou falha
 * do processo de pré-inicialização.
 *
 * Propósito:
 * 1. Garantir que o arquivo de banco de dados (db.json) esteja presente no diretório correto.
 * 2. Criar uma estrutura inicial consistente para o banco de dados, caso ele não exista.
 * 3. Registrar logs detalhados sobre o processo de pré-inicialização.
 * 4. Preparar o ambiente para que o bot possa ser iniciado sem problemas.
 *
 * Este arquivo deve ser executado antes de iniciar o bot para garantir que o ambiente está configurado corretamente.
 */

import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './utils/log.js';
import { createTables } from './utils/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = join(__dirname, '../db.json');
const defaultData = {
  users: [],
  matches: [],
  logs: [],
  // ... outras estruturas padrão
};

async function initialize() {
  Logger.info('Iniciando pré-inicialização...');

  try {
    if (!existsSync(DB_PATH)) {
      writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
      Logger.info('Arquivo db.json criado com sucesso');
    }

    await createTables();
    Logger.success('Pré-inicialização concluída');
  } catch (error) {
    Logger.error('Falha na pré-inicialização:', error as Error);
    process.exit(1);
  }
  Logger.info('Pré-inicialização finalizada.');
}

await initialize();