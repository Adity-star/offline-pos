"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class BackupManager {
    dbPath;
    backupDir;
    constructor(appPath) {
        this.dbPath = path_1.default.join(appPath, 'prisma', 'dev.db');
        this.backupDir = path_1.default.join(os_1.default.homedir(), 'Desktop', 'OfflinePOS_Backups');
        if (!fs_1.default.existsSync(this.backupDir)) {
            fs_1.default.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    async createBackup() {
        return new Promise(async (resolve) => {
            try {
                if (!fs_1.default.existsSync(this.dbPath)) {
                    return resolve({ success: false, error: 'Database file not found.' });
                }
                const dateStr = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
                const backupFileName = `pos_backup_${dateStr}.zip`;
                const backupFilePath = path_1.default.join(this.backupDir, backupFileName);
                const output = fs_1.default.createWriteStream(backupFilePath);
                const archive = (await import('archiver')).default('zip', { zlib: { level: 9 } });
                output.on('close', () => {
                    resolve({ success: true, filePath: backupFilePath });
                });
                archive.on('error', (err) => {
                    return resolve({ success: false, error: err.message });
                });
                archive.pipe(output);
                // Append the database file to the root of the archive
                archive.file(this.dbPath, { name: 'dev.db' });
                archive.finalize();
            }
            catch (error) {
                resolve({ success: false, error: error.message });
            }
        });
    }
    async listBackups() {
        try {
            if (!fs_1.default.existsSync(this.backupDir))
                return [];
            const files = fs_1.default.readdirSync(this.backupDir);
            return files
                .filter(f => f.endsWith('.zip'))
                .map(f => {
                const stats = fs_1.default.statSync(path_1.default.join(this.backupDir, f));
                return {
                    name: f,
                    path: path_1.default.join(this.backupDir, f),
                    size: stats.size,
                    createdAt: stats.birthtime
                };
            })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        catch {
            return [];
        }
    }
}
exports.BackupManager = BackupManager;
