import fs from 'fs/promises';
import path from 'path';
const BACKUP_DIR = './backup';
const DB_FILE = './db.json';
/**
 * Cria um backup do arquivo de banco de dados.
 */
export async function createBackup() {
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
    }
    catch (err) {
        console.error("❌ Erro ao criar backup:", err);
    }
}
//# sourceMappingURL=backup.js.map