import React from 'react';
import { Html } from '@react-three/drei';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

export class ModelErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('Model Error Boundary caught error:', error);
    
    // Handle specific GLTF loading errors
    if (error.message?.includes('loaderData.json is undefined') || 
        error.message?.includes('asset') ||
        error.message?.includes('json')) {
      console.warn('Model appears to lack proper GLTF structure, UV mapping, or textures');
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Model loading error details:', error, errorInfo);
    
    // Log specific information about GLTF errors
    if (error.message?.includes('loaderData.json is undefined')) {
      console.error('This model appears to be missing GLTF metadata or has corrupted structure');
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <Html center>
          <div className="bg-red-500/95 text-white px-4 py-3 rounded-lg shadow-lg max-w-md">
            <div className="font-medium text-sm mb-2">Model Loading Error</div>
            <div className="text-xs opacity-90">
              {this.state.error?.message || 'Failed to load 3D model'}
            </div>
            <div className="text-xs opacity-75 mt-2">
              Please try selecting a different model or refresh the page.
            </div>
            <button 
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-2 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </Html>
      );
    }

    try {
      return this.props.children;
    } catch (error) {
      console.error('Error rendering children in ModelErrorBoundary:', error);
      return (
        <Html center>
          <div className="bg-red-500/95 text-white px-4 py-3 rounded-lg shadow-lg max-w-md">
            <div className="font-medium text-sm mb-2">Rendering Error</div>
            <div className="text-xs opacity-90">
              An error occurred while rendering the 3D model
            </div>
            <div className="text-xs opacity-75 mt-2">
              Please try refreshing the page or selecting a different model.
            </div>
          </div>
        </Html>
      );
    }
  }
}

export function ModelErrorFallback({ error }: { error?: Error }) {
  const isUVMappingError = error?.message?.includes('loaderData.json is undefined') || 
                          error?.message?.includes('asset') ||
                          error?.message?.includes('json');

  return (
    <Html center>
      <div className="bg-red-500/95 text-white px-4 py-3 rounded-lg shadow-lg max-w-md">
        <div className="font-medium text-sm mb-2">3D Model Error</div>
        <div className="text-xs opacity-90">
          {isUVMappingError 
            ? 'Model lacks proper UV mapping or texture data'
            : error?.message || 'Unable to load the selected model'
          }
        </div>
        <div className="text-xs opacity-75 mt-2">
          {isUVMappingError 
            ? 'This model may not have UV coordinates or proper GLTF structure. Color changes will still work, but textures may not display correctly.'
            : 'This model file may be corrupted or incompatible. Try selecting a different model.'
          }
        </div>
      </div>
    </Html>
  );
}