import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const settingsService = {
  async get() {
    let settings = await prisma.setting.findFirst()
    if (!settings) {
      // Create default settings
      settings = await prisma.setting.create({
        data: {
          storeName: 'My Store',
          storeAddress: '',
          storePhone: '',
          storeEmail: '',
          invoicePrefix: 'INV',
          taxPercentage: new Prisma.Decimal(0),
          currencySymbol: '₹',
          thermalPaperWidth: '80mm',
          allowNegativeStock: false,
        },
      })
    }
    return settings
  },

  async update(data: Partial<{
    storeName: string
    storeAddress: string
    storePhone: string
    storeMobile: string
    storeEmail: string | null
    gstNumber: string | null
    invoicePrefix: string
    taxPercentage: number
    currencySymbol: string
    thermalPaperWidth: string
    printTemplate: string
    allowNegativeStock: boolean
    logoPath: string | null
    bankName: string | null
    bankAccountName: string | null
    bankAccountNumber: string | null
    bankIfsc: string | null
    bankBranch: string | null
  }>) {
    const settings = await this.get()

    const updateData: Prisma.SettingUpdateInput = {}
    if (data.storeName !== undefined) updateData.storeName = data.storeName
    if (data.storeAddress !== undefined) updateData.storeAddress = data.storeAddress
    if (data.storePhone !== undefined) updateData.storePhone = data.storePhone
    if (data.storeEmail !== undefined) updateData.storeEmail = data.storeEmail
    if (data.gstNumber !== undefined) updateData.gstNumber = data.gstNumber
    if (data.invoicePrefix !== undefined) updateData.invoicePrefix = data.invoicePrefix
    if (data.taxPercentage !== undefined)
      updateData.taxPercentage = new Prisma.Decimal(data.taxPercentage)
    if (data.currencySymbol !== undefined) updateData.currencySymbol = data.currencySymbol
    if (data.thermalPaperWidth !== undefined) updateData.thermalPaperWidth = data.thermalPaperWidth
    if (data.allowNegativeStock !== undefined) updateData.allowNegativeStock = data.allowNegativeStock
    if (data.logoPath !== undefined) updateData.logoPath = data.logoPath
    if (data.bankName !== undefined) updateData.bankName = data.bankName
    if (data.bankAccountName !== undefined) updateData.bankAccountName = data.bankAccountName
    if (data.bankAccountNumber !== undefined) updateData.bankAccountNumber = data.bankAccountNumber
    if (data.bankIfsc !== undefined) updateData.bankIfsc = data.bankIfsc
    if (data.bankBranch !== undefined) updateData.bankBranch = data.bankBranch

    return prisma.setting.update({
      where: { id: settings.id },
      data: updateData,
    })
  },

  async getSystemStatus() {
    const [
      totalCustomers,
      totalProducts,
      totalSales,
      activeCustomers,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.sale.count({ where: { isDeleted: false } }),
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT customerId) as count
        FROM Sale
        WHERE isDeleted = 0 AND createdAt >= datetime('now', '-30 days')
      `,
    ])

    return {
      totalCustomers,
      totalProducts,
      totalSales,
      activeCustomers: activeCustomers[0]?.count || 0,
      databaseStatus: 'Connected',
      version: '1.0.0',
    }
  },
}
