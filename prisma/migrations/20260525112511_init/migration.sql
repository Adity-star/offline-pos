-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paymentMode" TEXT NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "customerId", "id", "notes", "paymentMode", "saleId") SELECT "amount", "createdAt", "customerId", "id", "notes", "paymentMode", "saleId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "userId" TEXT NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'FLAT',
    "discountValue" DECIMAL NOT NULL,
    "discountAmount" DECIMAL NOT NULL,
    "labourCost" DECIMAL NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL NOT NULL,
    "totalProfit" DECIMAL NOT NULL,
    "paidAmount" DECIMAL NOT NULL,
    "dueAmount" DECIMAL NOT NULL,
    "paymentMode" TEXT NOT NULL DEFAULT 'CASH',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("createdAt", "customerId", "discountAmount", "discountType", "discountValue", "dueAmount", "grandTotal", "id", "invoiceNumber", "isDeleted", "labourCost", "notes", "paidAmount", "paymentMode", "paymentStatus", "subtotal", "taxAmount", "totalProfit", "updatedAt", "userId") SELECT "createdAt", "customerId", "discountAmount", "discountType", "discountValue", "dueAmount", "grandTotal", "id", "invoiceNumber", "isDeleted", "labourCost", "notes", "paidAmount", "paymentMode", "paymentStatus", "subtotal", "taxAmount", "totalProfit", "updatedAt", "userId" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_invoiceNumber_key" ON "Sale"("invoiceNumber");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");
CREATE INDEX "Sale_paymentStatus_idx" ON "Sale"("paymentStatus");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "fullName", "id", "isActive", "password", "role", "updatedAt", "username") SELECT "createdAt", "fullName", "id", "isActive", "password", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
