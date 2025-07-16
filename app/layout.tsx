import type React from "react"
import { Metadata } from "next"
import { ClientLayout } from "./components/client-layout"
import { ErrorHandlers } from "./components/error-handlers"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-screen h-screen overflow-hidden">
        <ErrorHandlers />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  generator: 'v0.dev',
};
