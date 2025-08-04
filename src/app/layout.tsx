import './globals.css'
import { inter } from '@/styles/fonts'
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: 'Invoice Platform',
  description: 'მარტივი და ეფექტური ინვოისების მართვა',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ka" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
