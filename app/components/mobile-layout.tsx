"use client"

import React from 'react'

interface MobileLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  header?: React.ReactNode
}

export function MobileLayout({ children, sidebar, header }: MobileLayoutProps) {
  return (
    <div className="md:hidden flex flex-col h-screen w-full overflow-hidden">
      {/* Mobile Header */}
      {header && (
        <div className="flex-shrink-0">
          {header}
        </div>
      )}
      
      {/* Mobile Main Content */}
      <div className="flex-1 relative pb-20">
        {children}
      </div>
      
      {/* Mobile Sidebar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {sidebar}
      </div>
    </div>
  )
} 