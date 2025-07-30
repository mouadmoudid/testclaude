// app/layout.tsx - Version minimale pour API-only
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Laundry API Server',
  description: 'API Server for Laundry Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        padding: 0, 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#ffffff'
      }}>
        {children}
      </body>
    </html>
  )
}