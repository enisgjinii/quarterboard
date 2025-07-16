"use client"

import { useEffect } from 'react'
import { setupGlobalErrorHandlers } from '@/lib/error-utils'

export function ErrorHandlers() {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return null;
} 