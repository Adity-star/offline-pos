import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/app-shell'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata = {
  title: 'AK Software',
  description: 'Production-grade offline billing and inventory management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppShell>
          {children}
        </AppShell>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}