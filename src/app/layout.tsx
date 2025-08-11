import './globals.css'
import { inter } from '@/styles/fonts'
import { Toaster } from "@/components/ui/sonner"
import { PWAProvider } from '@/components/providers/pwa-provider'

export const metadata = {
  title: 'Invoice Platform - ინვოისის პლატფორმა',
  description: 'მარტივი და ეფექტური ინვოისების მართვა ქართული ბიზნესებისთვის',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Invoice Platform',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Invoice Platform',
    title: 'Invoice Platform - ინვოისის პლატფორმა',
    description: 'მარტივი და ეფექტური ინვოისების მართვა ქართული ბიზნესებისთვის',
  },
  twitter: {
    card: 'summary',
    title: 'Invoice Platform - ინვოისის პლატფორმა',
    description: 'მარტივი და ეფექტური ინვოისების მართვა ქართული ბიზნესებისთვის',
  },
  icons: {
    icon: '/icons/icon-192.png',
    shortcut: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ka" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Invoice Platform" />
        <meta name="application-name" content="Invoice Platform" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#0ea5e9" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <PWAProvider>
          {children}
        </PWAProvider>
        <Toaster />
      </body>
    </html>
  )
}
