import { useEffect, useState, lazy, Suspense } from 'react';
import { useInView } from 'react-intersection-observer';

// Lazy loading component wrapper
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Image optimization hook
export function useOptimizedImage(
  src: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  }
) {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  
  useEffect(() => {
    // In a real implementation, this would use Next.js Image component
    // or a service like Cloudinary, Imgix, etc.
    // This is a simplified version for demonstration
    
    const params = new URLSearchParams();
    if (options?.width) params.append('w', options.width.toString());
    if (options?.height) params.append('h', options.height.toString());
    if (options?.quality) params.append('q', options.quality.toString());
    if (options?.format) params.append('fm', options.format);
    
    // If using a real image optimization service:
    // setOptimizedSrc(`https://image-service.com/${src}?${params.toString()}`);
    
    // For now, just return the original source
    setOptimizedSrc(src);
  }, [src, options]);
  
  return optimizedSrc;
}

// Lazy loading for images
export function useLazyImage(src: string, threshold = 0.1) {
  const [loaded, setLoaded] = useState(false);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });
  
  useEffect(() => {
    if (inView && !loaded) {
      const img = new Image();
      img.src = src;
      img.onload = () => setLoaded(true);
    }
  }, [inView, src, loaded]);
  
  return { ref, loaded: inView && loaded, inView };
}

// Cache optimization for data
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    ttl?: number; // Time to live in milliseconds
    staleWhileRevalidate?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem(`cache_${key}`);
        const cachedTimestamp = localStorage.getItem(`cache_${key}_timestamp`);
        
        if (cachedData && cachedTimestamp) {
          const parsedData = JSON.parse(cachedData);
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          const ttl = options?.ttl || 5 * 60 * 1000; // Default 5 minutes
          
          // If cache is still valid
          if (now - timestamp < ttl) {
            setData(parsedData);
            setLoading(false);
            return;
          }
          
          // If using stale-while-revalidate pattern
          if (options?.staleWhileRevalidate) {
            setData(parsedData);
            setLoading(false);
          }
        }
        
        // Fetch fresh data
        const freshData = await fetchFn();
        setData(freshData);
        setLoading(false);
        
        // Update cache
        localStorage.setItem(`cache_${key}`, JSON.stringify(freshData));
        localStorage.setItem(`cache_${key}_timestamp`, Date.now().toString());
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };
    
    fetchData();
  }, [key, options?.ttl, options?.staleWhileRevalidate]);
  
  return { data, loading, error };
}

// Database query optimization helper
export function optimizeQuery(query: string): string {
  // This is a simplified example - in a real app, you would use
  // a proper query analyzer or optimization tool
  
  // Example optimizations:
  // 1. Add EXPLAIN ANALYZE for debugging
  // 2. Ensure proper indexes are used
  // 3. Limit result set size
  // 4. Use specific columns instead of SELECT *
  
  // For demonstration purposes only
  const optimized = query
    .replace(/SELECT \*/g, 'SELECT id, name, created_at') // Select specific columns
    .replace(/ORDER BY created_at/g, 'ORDER BY created_at DESC LIMIT 100'); // Add limit
  
  return optimized;
}

// Bundle analysis helper (would be used with webpack-bundle-analyzer in a real app)
export const bundleAnalysis = {
  // These would be populated by the webpack-bundle-analyzer in a real app
  totalSize: '0 KB',
  chunks: [],
  suggestions: [
    'Use dynamic imports for large components',
    'Split vendor code into separate chunks',
    'Enable tree shaking for unused code',
    'Compress images and assets',
  ],
};

// Code splitting helper for routes
export function withCodeSplitting<T extends React.ComponentType<any>>(
  Component: T,
  chunkName: string
) {
  // In a real app, this would use webpack's magic comments for named chunks
  // For example: import(/* webpackChunkName: "dashboard" */ './Dashboard')
  // This is a simplified version for demonstration
  return Component;
}
