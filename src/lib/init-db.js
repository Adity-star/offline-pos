"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const client_1 = require("@prisma/client");
const electron_1 = require("electron");
const fs_1 = require("fs");
const path_1 = require("path");
const prisma_1 = require("./prisma");
function getDatabasePath() {
    const appData = process.env.APPDATA || path_1.join(process.env.USERPROFILE || process.cwd(), 'AppData', 'Roaming');
    return path_1.join(appData, 'ak-software', 'shop.db');
}
function getTemplateDatabasePath() {
    if (electron_1.app.isPackaged) {
        return path_1.join(process.resourcesPath, 'database', 'shop-template.db');
    }
    return path_1.join(process.cwd(), 'database', 'shop-template.db');
}
function ensureDatabaseExists() {
    const dbPath = getDatabasePath();
    const templatePath = getTemplateDatabasePath();
    const dbDir = path_1.dirname(dbPath);
    if (!fs_1.existsSync(dbDir)) {
        fs_1.mkdirSync(dbDir, { recursive: true });
    }
    const exists = fs_1.existsSync(dbPath);
    const isEmpty = exists && fs_1.statSync(dbPath).size === 0;
    if (!exists || isEmpty) {
        console.log('Database does not exist or is empty.');
        console.log('Looking for template:', templatePath);
        if (!fs_1.existsSync(templatePath)) {
            throw new Error(`Database template not found:\n${templatePath}`);
        }
        fs_1.copyFileSync(templatePath, dbPath);
        console.log('Created database from template:', dbPath);
    }
}
async function initializeDatabase() {
    console.log('Start database initialization...');
    ensureDatabaseExists();
    const existingSettings = await prisma_1.prisma.setting.count();
    if (existingSettings === 0) {
        await prisma_1.prisma.setting.create({
            data: {
                storeName: 'Neural Slate SuperMart',
                storeAddress: '',
                storePhone: '+91 9876543210',
                storeEmail: '',
                invoicePrefix: 'INV',
                taxPercentage: new client_1.Prisma.Decimal(0),
                currencySymbol: '₹',
                thermalPaperWidth: '80mm',
                allowNegativeStock: false,
            },
        });
        console.log('Created default settings');
    }
    const categories = [
        'Electronics',
        'Miscellaneous',
        'Hardware',
        'Tiles'
    ];
    for (const name of categories) {
        await prisma_1.prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    console.log('Created default categories');
    console.log('Database initialization finished.');
}
