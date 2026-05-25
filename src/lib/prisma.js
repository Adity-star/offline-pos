"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
function getDatabaseUrl() {
    if (process.env.APPDATA) {
        const dbPath = path_1.default.join(process.env.APPDATA, "AK Software", 'shop.db');
        return `file:${dbPath}`;
    }
    return 'file:./database/shop.db';
}
process.env.DATABASE_URL = getDatabaseUrl();
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
