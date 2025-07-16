import React from 'react';
import { AlertTriangle, X, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  variant?: 'error' | 'warning' | 'info';
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  showDetails = false,
  variant = 'error'
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          bg: 'bg-yellow-500/95',
          icon: 'text-yellow-100',
          border: 'border-yellow-400'
        };
      case 'info':
        return {
          bg: 'bg-blue-500/95',
          icon: 'text-blue-100',
          border: 'border-blue-400'
        };
      default:
        return {
          bg: 'bg-red-500/95',
          icon: 'text-red-100',
          border: 'border-red-400'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 ${styles.bg} text-white rounded-lg shadow-lg border ${styles.border} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {variant === 'warning' ? (
            <AlertTriangle className="w-5 h-5" />
          ) : variant === 'info' ? (
            <Info className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-1">
            {variant === 'warning' ? 'Warning' : variant === 'info' ? 'Information' : 'Error'}
          </div>
          <div className="text-xs opacity-90 break-words">
            {errorMessage}
          </div>
          
          {showDetails && errorStack && (
            <details className="mt-2">
              <summary className="text-xs opacity-75 cursor-pointer hover:opacity-100">
                Show technical details
              </summary>
              <pre className="text-xs opacity-75 mt-1 whitespace-pre-wrap break-words">
                {errorStack}
              </pre>
            </details>
          )}
          
          {isMobile && (
            <div className="text-xs opacity-75 mt-2">
              💡 Tap "Details" in the toast notification for more information
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 flex gap-1">
          {onRetry && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRetry}
              className="text-white hover:bg-white/20 p-1 h-6 w-6"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-white hover:bg-white/20 p-1 h-6 w-6"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile-specific error overlay
export function MobileErrorOverlay({ 
  error, 
  onRetry, 
  onDismiss 
}: { 
  error: Error | string; 
  onRetry?: () => void; 
  onDismiss?: () => void; 
}) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Error</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Something went wrong</p>
          </div>
        </div>
        
        <div className="text-sm text-slate-700 dark:text-slate-300 mb-6 break-words">
          {errorMessage}
        </div>
        
        <div className="flex gap-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="outline"
              onClick={onDismiss}
              className="flex-1"
            >
              Dismiss
            </Button>
          )}
        </div>
        
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
          Check the browser console for technical details
        </div>
      </div>
    </div>
  );
} 