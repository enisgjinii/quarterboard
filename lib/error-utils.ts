import { toast } from "./toast-utils";

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  errorType: 'error' | 'promise' | 'boundary' | 'console';
}

class ErrorLogger {
  private errors: ErrorInfo[] = [];
  private maxErrors = 100;

  logError(
    error: Error | string,
    errorInfo?: React.ErrorInfo,
    errorType: ErrorInfo['errorType'] = 'error'
  ) {
    const errorInfoObj: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      componentStack: errorInfo?.componentStack || undefined,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      errorType,
    };

    // Log to console
    console.error(`[${errorType.toUpperCase()}] Error:`, error);
    if (errorInfo) {
      console.error('Error Info:', errorInfo);
    }

    // Store error
    this.errors.push(errorInfoObj);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Show toast notification
    this.showErrorToast(errorInfoObj);

    // Log to external service if needed (you can add analytics here)
    this.logToExternalService(errorInfoObj);
  }

  private showErrorToast(errorInfo: ErrorInfo) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      errorInfo.userAgent
    );

    // Different toast messages for different error types
    let title = 'An error occurred';
    let description = errorInfo.message;

    switch (errorInfo.errorType) {
      case 'promise':
        title = 'Network or async error';
        description = 'Please check your connection and try again';
        break;
      case 'boundary':
        title = 'Application error';
        description = errorInfo.message;
        break;
      case 'console':
        title = 'Console error';
        description = errorInfo.message;
        break;
      default:
        title = 'An error occurred';
        description = errorInfo.message;
    }

    // Show toast with error details
    toast.error(title, {
      description: isMobile ? description : `${description}\nCheck console for details`,
      duration: 5000,
      action: {
        label: 'Details',
        onClick: () => this.showErrorDetails(errorInfo),
      },
    });
  }

  private showErrorDetails(errorInfo: ErrorInfo) {
    // Create a detailed error report
    const errorReport = `
Error Details:
- Message: ${errorInfo.message}
- Type: ${errorInfo.errorType}
- Time: ${new Date(errorInfo.timestamp).toLocaleString()}
- URL: ${errorInfo.url}
- User Agent: ${errorInfo.userAgent}
${errorInfo.stack ? `- Stack: ${errorInfo.stack}` : ''}
${errorInfo.componentStack ? `- Component Stack: ${errorInfo.componentStack}` : ''}
    `.trim();

    // Log to console for easy access
    console.group('🔍 Error Details');
    console.log('Message:', errorInfo.message);
    console.log('Type:', errorInfo.errorType);
    console.log('Time:', new Date(errorInfo.timestamp).toLocaleString());
    console.log('URL:', errorInfo.url);
    console.log('User Agent:', errorInfo.userAgent);
    if (errorInfo.stack) console.log('Stack:', errorInfo.stack);
    if (errorInfo.componentStack) console.log('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Show alert with details (for mobile users)
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(errorInfo.userAgent)) {
      alert(`Error Details:\n\n${errorInfo.message}\n\nCheck browser console for full details.`);
    }
  }

  private logToExternalService(errorInfo: ErrorInfo) {
    // You can add external logging services here (e.g., Sentry, LogRocket, etc.)
    // For now, we'll just log to console
    console.log('📊 Error logged for analytics:', {
      message: errorInfo.message,
      type: errorInfo.errorType,
      timestamp: errorInfo.timestamp,
    });
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  getErrorCount(): number {
    return this.errors.length;
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Global error handlers
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;

  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    errorLogger.logError(event.error || new Error(event.message), undefined, 'error');
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.logError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      undefined,
      'promise'
    );
  });

  // Override console.error to capture console errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorMessage = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    
    errorLogger.logError(new Error(errorMessage), undefined, 'console');
    originalConsoleError.apply(console, args);
  };

  // Override console.warn to capture warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const warningMessage = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    
    // Log warnings as errors for visibility
    errorLogger.logError(new Error(`Warning: ${warningMessage}`), undefined, 'console');
    originalConsoleWarn.apply(console, args);
  };
}

// React Error Boundary helper
export function createErrorBoundaryHandler() {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    errorLogger.logError(error, errorInfo, 'boundary');
  };
}

// Utility function to manually log errors
export function logError(
  error: Error | string,
  errorInfo?: React.ErrorInfo,
  errorType: ErrorInfo['errorType'] = 'error'
) {
  errorLogger.logError(error, errorInfo, errorType);
}

// Export for use in components
export { errorLogger as default }; 