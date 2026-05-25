"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const client_1 = require("@prisma/client");
const prisma_1 = require("./prisma");
async function initializeDatabase() {
    console.log(`Start seeding ...`);
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
        console.log(`Created default settings`);
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
    console.log(`Created default categories`);
    console.log(`Seeding finished.`);
}
