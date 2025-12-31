// Performance optimization utilities and caching system

// Simple in-memory cache with TTL
class Cache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

  set(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
export const apiCache = new Cache<any>();
export const imageCache = new Cache<string>();
export const userCache = new Cache<any>();

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memoized API wrapper
export const memoizedApiCall = async <T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl: number = 300000
): Promise<T> => {
  // Check cache first
  const cached = apiCache.get(key);
  if (cached) {
    return cached;
  }

  // Make API call
  const result = await apiCall();
  
  // Cache the result
  apiCache.set(key, result, ttl);
  
  return result;
};

// Image optimization utilities
export const optimizeImage = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string => {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // Check if already cached
  const cacheKey = `${src}-${width}-${height}-${quality}-${format}`;
  const cached = imageCache.get(cacheKey);
  if (cached) return cached;

  // For demo purposes, return original src
  // In production, you'd use an image CDN or service
  let optimized = src;
  
  // Add query parameters for optimization (example)
  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality !== 80) params.append('q', quality.toString());
  if (format !== 'webp') params.append('f', format);

  if (params.toString()) {
    optimized += (src.includes('?') ? '&' : '?') + params.toString();
  }

  imageCache.set(cacheKey, optimized);
  return optimized;
};

// Lazy loading utilities
export const createLazyLoader = (
  loader: () => Promise<any>,
  fallback: any = null
) => {
  let promise: Promise<any> | null = null;

  return (): Promise<any> => {
    if (promise) return promise;

    promise = loader()
      .then(module => module)
      .catch(error => {
        promise = null; // Reset on error
        throw error;
      });

    return promise;
  };
};

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static startTimer(name: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    };
  }

  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  static getMetrics(name: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  static getAllMetrics(): Record<string, ReturnType<typeof PerformanceMonitor.getMetrics>> {
    const result: Record<string, ReturnType<typeof PerformanceMonitor.getMetrics>> = {};
    
    for (const [name] of this.metrics.entries()) {
      result[name] = this.getMetrics(name);
    }
    
    return result;
  }
}

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Virtual scrolling utilities
export const createVirtualScroll = (
  containerHeight: number,
  itemHeight: number,
  totalItems: number
) => {
  const visibleItems = Math.ceil(containerHeight / itemHeight) + 2; // Buffer for smooth scrolling
  
  return {
    visibleItems,
    startIndex: (scrollTop: number) => Math.floor(scrollTop / itemHeight),
    endIndex: (scrollTop: number) => Math.min(
      Math.floor(scrollTop / itemHeight) + visibleItems,
      totalItems - 1
    ),
    totalHeight: totalItems * itemHeight,
  };
};

// Bundle size optimization
export const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.head.appendChild(script);
  });
};

export const loadStyle = (href: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    
    document.head.appendChild(link);
  });
};

// Memory management
export const cleanup = {
  // Clean up caches periodically
  scheduleCleanup: (interval: number = 60000) => {
    setInterval(() => {
      apiCache.cleanup();
      imageCache.cleanup();
      userCache.cleanup();
    }, interval);
  },

  // Clear all caches
  clearAll: () => {
    apiCache.clear();
    imageCache.clear();
    userCache.clear();
  },

  // Get cache sizes
  getCacheSizes: () => ({
    api: apiCache.size(),
    images: imageCache.size(),
    users: userCache.size(),
  }),
};

// Request batching
export class RequestBatcher<T> {
  private queue: Array<{ data: T; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private batchFn: (items: T[]) => Promise<any[]>,
    private delay: number = 100
  ) {}

  add(data: T): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });

      if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const items = this.queue.splice(0);
    this.timeout = null;

    try {
      const results = await this.batchFn(items.map(item => item.data));
      
      items.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      items.forEach(item => {
        item.reject(error);
      });
    }
  }
}

// Export default performance utilities
export default {
  Cache,
  debounce,
  throttle,
  memoizedApiCall,
  optimizeImage,
  createLazyLoader,
  PerformanceMonitor,
  createIntersectionObserver,
  createVirtualScroll,
  loadScript,
  loadStyle,
  cleanup,
  RequestBatcher,
};
