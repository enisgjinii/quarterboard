"use client"

import { toast as sonnerToast } from "sonner";

export const toast = {
  error: (message: string, options?: any) => {
    if (typeof window !== 'undefined') {
      sonnerToast.error(message, options);
    }
  },
  success: (message: string, options?: any) => {
    if (typeof window !== 'undefined') {
      sonnerToast.success(message, options);
    }
  },
  warning: (message: string, options?: any) => {
    if (typeof window !== 'undefined') {
      sonnerToast.warning(message, options);
    }
  },
  info: (message: string, options?: any) => {
    if (typeof window !== 'undefined') {
      sonnerToast.info(message, options);
    }
  }
}; 