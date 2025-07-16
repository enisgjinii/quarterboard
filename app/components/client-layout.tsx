"use client"

import React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ErrorBoundary } from "react-error-boundary"
import { createErrorBoundaryHandler } from "@/lib/error-utils"
import { Toaster } from "sonner"

function GlobalErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  console.error('Global error boundary caught:', error);
  
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="bg-red-500/95 text-white px-6 py-4 rounded-lg shadow-lg max-w-md w-full">
        <div className="font-medium text-lg mb-2">Application Error</div>
        <div className="text-sm opacity-90 mb-4 break-words">{error.message}</div>
        <div className="text-xs opacity-75 mb-4">
          Error details have been logged to the console. Please check the browser console for more information.
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      FallbackComponent={GlobalErrorFallback}
      onError={createErrorBoundaryHandler()}
    >
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <SidebarProvider defaultOpen={true}>
          {children}
        </SidebarProvider>
      </ThemeProvider>
      <Toaster />
    </ErrorBoundary>
  );
} 