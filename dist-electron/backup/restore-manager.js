"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestoreManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const extract_zip_1 = __importDefault(require("extract-zip"));
class RestoreManager {
    dbPath;
    constructor(appPath) {
        this.dbPath = path_1.default.join(appPath, 'prisma', 'dev.db');
    }
    async restoreBackup(zipPath) {
        return new Promise(async (resolve) => {
            try {
                if (!fs_1.default.existsSync(zipPath)) {
                    return resolve({ success: false, error: 'Backup file not found.' });
                }
                // We extract to a temporary folder, check if dev.db exists, then replace the current DB.
                const tempDir = path_1.default.join(path_1.default.dirname(zipPath), 'pos_temp_extract_' + Date.now());
                try {
                    await (0, extract_zip_1.default)(zipPath, { dir: tempDir });
                    const extractedDbPath = path_1.default.join(tempDir, 'dev.db');
                    if (!fs_1.default.existsSync(extractedDbPath)) {
                        throw new Error('Invalid backup file. Missing dev.db.');
                    }
                    // Before overwriting, maybe create a temporary backup of the CURRENT db just in case
                    const currentBackupPath = this.dbPath + '.bak';
                    if (fs_1.default.existsSync(this.dbPath)) {
                        fs_1.default.copyFileSync(this.dbPath, currentBackupPath);
                    }
                    // Replace the actual DB
                    fs_1.default.copyFileSync(extractedDbPath, this.dbPath);
                    // Cleanup temp extraction
                    fs_1.default.rmSync(tempDir, { recursive: true, force: true });
                    resolve({ success: true });
                }
                catch (extractError) {
                    // Cleanup temp extraction if failed
                    if (fs_1.default.existsSync(tempDir)) {
                        fs_1.default.rmSync(tempDir, { recursive: true, force: true });
                    }
                    resolve({ success: false, error: extractError.message });
                }
            }
            catch (error) {
                resolve({ success: false, error: error.message });
            }
        });
    }
}
exports.RestoreManager = RestoreManager;
