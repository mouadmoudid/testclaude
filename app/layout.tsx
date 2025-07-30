import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Laundry Management Platform',
  description: 'Professional laundry service management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}