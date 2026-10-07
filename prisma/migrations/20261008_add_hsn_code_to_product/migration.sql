-- AlterTable: Add hsnCode column to Product table
ALTER TABLE "Product" ADD COLUMN "hsnCode" TEXT;

-- CreateIndex: Add index on hsnCode
CREATE INDEX "Product_hsnCode_idx" ON "Product"("hsnCode");
