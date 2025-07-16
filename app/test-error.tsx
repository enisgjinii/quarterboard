"use client"

import { Button } from "@/components/ui/button"
import { logError } from "@/lib/error-utils"

export function TestErrorComponent() {
  const testErrors = () => {
    // Test different types of errors
    console.log('Testing error handling system...');
    
    // Test console.error
    console.error('Test console error');
    
    // Test manual error logging
    logError('Test manual error', undefined, 'error');
    
    // Test promise rejection
    Promise.reject(new Error('Test promise rejection'));
    
    // Test thrown error
    setTimeout(() => {
      throw new Error('Test thrown error');
    }, 1000);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Error Handling Test</h2>
      <Button onClick={testErrors} className="bg-red-500 hover:bg-red-600">
        Test Error Handling
      </Button>
      <p className="text-sm text-gray-600 mt-2">
        Click the button to test various error scenarios. Check the console and error monitor for results.
      </p>
    </div>
  );
} 