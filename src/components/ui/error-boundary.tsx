import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
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

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // You could send this to an error reporting service
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-foreground">Something went wrong</CardTitle>
          <CardDescription>
            {error?.message || 'An unexpected error occurred. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={reset} variant="hero" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading components
export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]}`} />
  );
};

export const LoadingCard = ({ title }: { title?: string }) => (
  <Card className="border-0 shadow-lg">
    <CardHeader>
      <div className="loading-shimmer h-6 w-32 rounded bg-muted" />
      {title && <div className="loading-shimmer h-4 w-48 rounded bg-muted mt-2" />}
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="loading-shimmer h-4 w-full rounded bg-muted" />
        <div className="loading-shimmer h-4 w-3/4 rounded bg-muted" />
        <div className="loading-shimmer h-4 w-1/2 rounded bg-muted" />
      </div>
    </CardContent>
  </Card>
);

export const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={`loading-shimmer rounded bg-muted ${className}`} />
);

// Error component for API calls
export const ApiError = ({ 
  error, 
  onRetry 
}: { 
  error: string | Error; 
  onRetry?: () => void;
}) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className="border-0 shadow-lg border-destructive/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">Error</h4>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="flex-shrink-0"
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
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </CardContent>
  </Card>
);

// Retry wrapper for API calls
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

// Custom hook for async operations with loading and error states
export const useAsync = <T,>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await withRetry(asyncFn);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, deps);

  React.useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
};
