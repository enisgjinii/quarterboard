import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Metadata } from "next"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-screen h-screen overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="w-full h-full">
            <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  generator: 'v0.dev',
  // Add preload links for common fonts to improve performance
  other: {
    'link': [
      { 
        rel: 'preload', 
        href: '/fonts/helvetiker_regular.typeface.json', 
        as: 'fetch',
        crossOrigin: 'anonymous'
      },
      { 
        rel: 'preload', 
        href: '/fonts/EBGaramond-Regular.ttf', 
        as: 'font',
        type: 'font/ttf',
        crossOrigin: 'anonymous'
      },
      { 
        rel: 'preload', 
        href: '/fonts/CopperplateCC-Bold.ttf', 
        as: 'font',
        type: 'font/ttf',
        crossOrigin: 'anonymous'
      },
      { 
        rel: 'preload', 
        href: '/fonts/Bookman Old Style Regular.ttf', 
        as: 'font',
        type: 'font/ttf',
        crossOrigin: 'anonymous'
      }
    ]
  }
};
