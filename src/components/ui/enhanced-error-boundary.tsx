import React, { Component, ErrorInfo, ReactNode, ComponentType } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ComponentType<FallbackProps>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface FallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  onRetry: () => void;
}

const DefaultErrorFallback: ComponentType<FallbackProps> = ({ 
  error, 
  errorInfo, 
  retryCount, 
  onRetry 
}) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6 animate-fade-in">
      <Card className="w-full max-w-md border-0 shadow-lg hover-lift animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4 animate-pulse-soft">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {error?.message || 'An unexpected error occurred. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {retryCount > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Retry attempts: {retryCount}
            </div>
          )}
          
          <div className="flex gap-3">
            <Button 
              onClick={onRetry} 
              variant="default" 
              className="flex-1 gap-2 hover-lift"
              disabled={retryCount >= 3}
            >
              <RefreshCw className="h-4 w-4" />
              {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
            </Button>
            
            <Button 
              onClick={handleGoHome} 
              variant="outline" 
              className="gap-2 hover-lift"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>

          {import.meta.env.DEV && error && (
            <details className="mt-4 p-3 bg-muted rounded-lg text-xs">
              <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
              <pre className="whitespace-pre-wrap text-red-600">
                {error.stack}
                {'\n\n'}
                {errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // In production, you would send this to an error reporting service
    if (!import.meta.env.DEV) {
      // Example: sendToErrorService(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for async error handling
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error | string) => {
    const err = error instanceof Error ? error : new Error(error);
    setError(err);
    
    // Log error
    console.error('Error handled by hook:', err);
  }, []);

  // Throw error if it exists to trigger error boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    handleError,
    resetError,
  };
};

// Component for handling API errors
export const ApiErrorBoundary: ComponentType<{
  children: ReactNode;
  fallback?: ComponentType<{ error: Error; onRetry: () => void }>;
}> = ({ children, fallback }) => {
  const { handleError, resetError } = useErrorHandler();

  const handleApiError = React.useCallback((error: Error) => {
    // Add context for API errors
    const apiError = new Error(`API Error: ${error.message}`);
    apiError.stack = error.stack;
    handleError(apiError);
  }, [handleError]);

  return (
    <EnhancedErrorBoundary
      fallback={({ error, onRetry }) => 
        fallback ? (
          React.createElement(fallback, { error, onRetry })
        ) : (
          <DefaultErrorFallback 
            error={error} 
            errorInfo={null} 
            retryCount={0} 
            onRetry={() => {
              onRetry();
              resetError();
            }} 
          />
        )
      }
    >
      {React.cloneElement(children as React.ReactElement, {
        onError: handleApiError,
      })}
    </EnhancedErrorBoundary>
  );
};

// Loading state component
export const LoadingState: ComponentType<{
  message?: string;
  showSpinner?: boolean;
}> = ({ message = 'Loading...', showSpinner = true }) => (
  <div className="flex flex-col items-center justify-center p-8 animate-fade-in">
    {showSpinner && (
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
    )}
    <p className="text-muted-foreground animate-pulse-soft">{message}</p>
  </div>
);

// Error state component
export const ErrorState: ComponentType<{
  error: string | Error;
  onRetry?: () => void;
  showIcon?: boolean;
}> = ({ error, onRetry, showIcon = true }) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className="border-0 shadow-lg border-destructive/20 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          {showIcon && (
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">Error</h4>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="flex-shrink-0 hover-lift"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Empty state component
export const EmptyState: ComponentType<{
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <Card className="border-0 shadow-lg animate-fade-in">
    <CardContent className="p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 animate-float">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </CardContent>
  </Card>
);

// Retry wrapper for async operations
export const withRetry = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError!;
};

export default EnhancedErrorBoundary;
