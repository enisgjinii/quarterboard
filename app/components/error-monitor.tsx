import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw, Info, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorLogger } from '@/lib/error-utils';

interface ErrorMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function ErrorMonitor({ isVisible, onToggle }: ErrorMonitorProps) {
  const [errors, setErrors] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Update errors every second
    const interval = setInterval(() => {
      setErrors(errorLogger.getErrors());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearErrors = () => {
    errorLogger.clearErrors();
    setErrors([]);
  };

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm"
      >
        <Eye className="w-4 h-4 mr-2" />
        Error Monitor
        {errors.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
            {errors.length}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="font-medium text-sm">Error Monitor</h3>
          {errors.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {errors.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 w-6 p-0"
          >
            {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearErrors}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {errors.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
            No errors logged
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {errors.map((error, index) => (
              <div
                key={index}
                className="p-2 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
              >
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${getErrorTypeColor(error.errorType)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {error.errorType.toUpperCase()}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 break-words">
                      {error.message}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                    {showDetails && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                          Technical details
                        </summary>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <div>URL: {error.url}</div>
                          <div>User Agent: {error.userAgent}</div>
                          {error.stack && (
                            <div>
                              <div className="font-medium">Stack:</div>
                              <pre className="whitespace-pre-wrap break-words text-xs">
                                {error.stack}
                              </pre>
                            </div>
                          )}
                          {error.componentStack && (
                            <div>
                              <div className="font-medium">Component Stack:</div>
                              <pre className="whitespace-pre-wrap break-words text-xs">
                                {error.componentStack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {errors.length} error{errors.length !== 1 ? 's' : ''} logged
        </div>
      </div>
    </div>
  );
} 