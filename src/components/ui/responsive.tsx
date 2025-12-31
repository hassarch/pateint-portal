// Responsive design utilities and components

import React, { useState, useEffect } from 'react';

// Breakpoint definitions
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Hook for responsive breakpoints
export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 640) setCurrentBreakpoint('xs');
      else if (width < 768) setCurrentBreakpoint('sm');
      else if (width < 1024) setCurrentBreakpoint('md');
      else if (width < 1280) setCurrentBreakpoint('lg');
      else if (width < 1536) setCurrentBreakpoint('xl');
      else setCurrentBreakpoint('2xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint: currentBreakpoint,
    isXs: currentBreakpoint === 'xs',
    isSm: currentBreakpoint === 'sm',
    isMd: currentBreakpoint === 'md',
    isLg: currentBreakpoint === 'lg',
    isXl: currentBreakpoint === 'xl',
    is2Xl: currentBreakpoint === '2xl',
    isMobile: currentBreakpoint === 'xs' || currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md',
    isDesktop: currentBreakpoint === 'lg' || currentBreakpoint === 'xl' || currentBreakpoint === '2xl',
  };
};

// Hook for media queries
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// Responsive container component
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxWidth?: Breakpoint;
  padding?: boolean;
}> = ({ children, className = '', maxWidth = '2xl', padding = true }) => {
  const paddingClass = padding ? 'px-4 sm:px-6 lg:px-8' : '';
  const maxWidthClass = `max-w-${maxWidth}`;
  
  return (
    <div className={`mx-auto ${maxWidthClass} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
};

// Responsive grid component
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: number;
}> = ({ children, className = '', cols = { xs: 1, sm: 2, md: 3, lg: 4 }, gap = 4 }) => {
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,
  ].filter(Boolean).join(' ');

  return <div className={`${gridClasses} ${className}`}>{children}</div>;
};

// Responsive text component
export const ResponsiveText: React.FC<{
  children: React.ReactNode;
  size?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
  className?: string;
}> = ({ children, size = { xs: 'base', sm: 'lg', md: 'xl', lg: '2xl' }, className = '' }) => {
  const textClasses = [
    size.xs && `text-${size.xs}`,
    size.sm && `sm:text-${size.sm}`,
    size.md && `md:text-${size.md}`,
    size.lg && `lg:text-${size.lg}`,
    size.xl && `xl:text-${size.xl}`,
    size['2xl'] && `2xl:text-${size['2xl']}`,
  ].filter(Boolean).join(' ');

  return <span className={`${textClasses} ${className}`}>{children}</span>;
};

// Responsive spacing utilities
export const responsiveSpacing = {
  // Padding
  p: {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  },
  px: {
    xs: 'px-2',
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
    xl: 'px-10',
  },
  py: {
    xs: 'py-2',
    sm: 'py-4',
    md: 'py-6',
    lg: 'py-8',
    xl: 'py-10',
  },
  // Margin
  m: {
    xs: 'm-2',
    sm: 'm-4',
    md: 'm-6',
    lg: 'm-8',
    xl: 'm-10',
  },
  mx: {
    xs: 'mx-2',
    sm: 'mx-4',
    md: 'mx-6',
    lg: 'mx-8',
    xl: 'mx-10',
  },
  my: {
    xs: 'my-2',
    sm: 'my-4',
    md: 'my-6',
    lg: 'my-8',
    xl: 'my-10',
  },
};

// Mobile-first responsive utilities
export const mobileFirst = {
  // Hide on mobile
  hiddenMobile: 'hidden sm:block',
  // Show only on mobile
  onlyMobile: 'block sm:hidden',
  // Hide on tablet
  hiddenTablet: 'block md:hidden lg:block',
  // Show only on tablet
  onlyTablet: 'hidden md:block lg:hidden',
  // Hide on desktop
  hiddenDesktop: 'block lg:hidden',
  // Show only on desktop
  onlyDesktop: 'hidden lg:block',
};

// Touch-friendly utilities
export const touchFriendly = {
  // Minimum touch target size (44px)
  touchTarget: 'min-h-[44px] min-w-[44px] flex items-center justify-center',
  // Spacing for touch interfaces
  touchSpacing: 'gap-4 p-4',
  // Larger tap areas
  largeTap: 'p-3 sm:p-2',
};

// Device detection utilities
export const deviceDetection = {
  // Check if device is touch capable
  isTouchDevice: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  // Check if device is iOS
  isIOS: (): boolean => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },
  
  // Check if device is Android
  isAndroid: (): boolean => {
    return /Android/.test(navigator.userAgent);
  },
  
  // Check if device is mobile
  isMobile: (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  // Get device orientation
  getOrientation: (): 'portrait' | 'landscape' => {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  },
};

// Responsive image component
export const ResponsiveImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className = '', sizes = '100vw', priority = false, onLoad, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <span className="text-muted-foreground">Image not available</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted rounded-lg animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

// Responsive navigation component
export const ResponsiveNav: React.FC<{
  children: React.ReactNode;
  mobileBreakpoint?: Breakpoint;
  className?: string;
}> = ({ children, mobileBreakpoint = 'md', className = '' }) => {
  const { isMobile } = useBreakpoint();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className={`${className}`}>
      {isMobile ? (
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-0.5 bg-current mb-1.5" />
            <div className="w-6 h-0.5 bg-current mb-1.5" />
            <div className="w-6 h-0.5 bg-current" />
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg p-4 z-50">
              {children}
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </nav>
  );
};

// Responsive card component
export const ResponsiveCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  compact?: boolean;
}> = ({ children, className = '', hover = false, compact = false }) => {
  const baseClasses = 'bg-card rounded-lg border shadow-sm transition-all duration-200';
  const sizeClasses = compact ? 'p-4' : 'p-6';
  const hoverClasses = hover ? 'hover:shadow-md hover:-translate-y-1' : '';
  const responsiveClasses = 'p-4 sm:p-6';

  return (
    <div className={`${baseClasses} ${responsiveClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

// Responsive utilities hook
export const useResponsiveUtils = () => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  
  return {
    // Get appropriate spacing based on device
    getSpacing: (mobile: string, tablet?: string, desktop?: string) => {
      if (isMobile) return mobile;
      if (isTablet && tablet) return tablet;
      if (isDesktop && desktop) return desktop;
      return mobile;
    },
    
    // Get appropriate columns based on device
    getColumns: (mobile: number, tablet?: number, desktop?: number) => {
      if (isMobile) return mobile;
      if (isTablet && tablet) return tablet;
      if (isDesktop && desktop) return desktop;
      return mobile;
    },
    
    // Get appropriate text size based on device
    getTextSize: (mobile: string, tablet?: string, desktop?: string) => {
      if (isMobile) return mobile;
      if (isTablet && tablet) return tablet;
      if (isDesktop && desktop) return desktop;
      return mobile;
    },
  };
};

// Viewport height utilities (for mobile browsers)
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return viewportHeight;
};

// CSS variable for viewport height
export const setViewportHeightCSS = () => {
  const updateCSS = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  updateCSS();
  window.addEventListener('resize', updateCSS);
  
  return () => window.removeEventListener('resize', updateCSS);
};

export default {
  breakpoints,
  useBreakpoint,
  useMediaQuery,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveText,
  responsiveSpacing,
  mobileFirst,
  touchFriendly,
  deviceDetection,
  ResponsiveImage,
  ResponsiveNav,
  ResponsiveCard,
  useResponsiveUtils,
  useViewportHeight,
  setViewportHeightCSS,
};
