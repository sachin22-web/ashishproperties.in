import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Wifi } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showNetworkHint?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('API Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log network-related errors differently
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('Network error') ||
        error.message.includes('timeout')) {
      console.warn('🌐 Network connectivity issue detected:', error.message);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error?.message?.includes('Failed to fetch') ||
                            this.state.error?.message?.includes('Network error') ||
                            this.state.error?.message?.includes('timeout');

      return (
        <Card className="max-w-md mx-auto my-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600">
              {isNetworkError ? (
                <Wifi className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <span>
                {isNetworkError ? 'Connection Issue' : 'Something went wrong'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              {isNetworkError ? (
                <>
                  <p>We're having trouble connecting to our servers.</p>
                  {this.props.showNetworkHint && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 text-xs">
                        💡 <strong>Tips:</strong>
                      </p>
                      <ul className="text-blue-700 text-xs mt-1 space-y-1">
                        <li>• Check your internet connection</li>
                        <li>• Try refreshing the page</li>
                        <li>• Some content may work in offline mode</li>
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p>An unexpected error occurred while loading this content.</p>
              )}
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={this.handleRetry}
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              {isNetworkError && (
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Refresh Page
                </Button>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium">
                  Debug Info (Development)
                </summary>
                <div className="mt-2 whitespace-pre-wrap">
                  <strong>Error:</strong> {this.state.error.message}
                  {this.state.errorInfo && (
                    <>
                      <br /><strong>Stack:</strong>
                      <pre className="mt-1 text-xs">{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ApiErrorBoundary;

// Higher-order component for wrapping components with API error boundary
export const withApiErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ApiErrorBoundary fallback={fallback} showNetworkHint>
      <Component {...props} />
    </ApiErrorBoundary>
  );
  
  WrappedComponent.displayName = `withApiErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
