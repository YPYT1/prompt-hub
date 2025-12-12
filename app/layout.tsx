import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { ToastProvider } from '@/components/ui/toast'
import { Header } from '@/components/layout/header'
import './globals.css'

export const metadata: Metadata = {
  title: '提示词管理中心 - Prompt Hub',
  description: '一个优雅的提示词管理工具，帮助你组织和管理 AI 提示词',
  keywords: ['提示词', 'AI', 'ChatGPT', 'Claude', '管理工具'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <ToastProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
