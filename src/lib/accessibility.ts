// Accessibility utilities and ARIA helpers

// Screen reader utilities
export const srOnly = {
  className: 'sr-only',
  style: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0',
  },
};

// Focus management
export const focusManagement = {
  // Trap focus within a container
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  // Set focus to an element
  setFocus: (element: HTMLElement | null) => {
    if (element) {
      setTimeout(() => {
        element.focus();
      }, 100);
    }
  },

  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const tagName = element.tagName.toLowerCase();
    const isFocusableTag = ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);
    const hasTabIndex = element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1';
    const isContentEditable = element.getAttribute('contenteditable') === 'true';
    
    return isFocusableTag || hasTabIndex || isContentEditable;
  },
};

// ARIA helpers
export const ariaHelpers = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Set up aria-describedby relationship
  describe: (element: HTMLElement, description: string) => {
    const id = ariaHelpers.generateId('desc');
    const descriptionElement = document.createElement('div');
    descriptionElement.id = id;
    descriptionElement.className = 'sr-only';
    descriptionElement.textContent = description;
    
    document.body.appendChild(descriptionElement);
    element.setAttribute('aria-describedby', id);
    
    return () => {
      document.body.removeChild(descriptionElement);
      element.removeAttribute('aria-describedby');
    };
  },

  // Set up aria-label with dynamic content
  label: (element: HTMLElement, getLabel: () => string) => {
    const updateLabel = () => {
      element.setAttribute('aria-label', getLabel());
    };
    
    updateLabel();
    
    return {
      update: updateLabel,
      remove: () => {
        element.removeAttribute('aria-label');
      },
    };
  },

  // Set up live regions for screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
};

// Keyboard navigation
export const keyboardNavigation = {
  // Handle common keyboard shortcuts
  handleShortcuts: (element: HTMLElement, shortcuts: Record<string, () => void>) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = [];
      if (e.ctrlKey) key.push('ctrl');
      if (e.shiftKey) key.push('shift');
      if (e.altKey) key.push('alt');
      key.push(e.key.toLowerCase());
      
      const shortcut = key.join('+');
      const handler = shortcuts[shortcut];
      
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  },

  // Handle escape key
  onEscape: (element: HTMLElement, handler: () => void) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handler();
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  },
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getLuminance: (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getRatio: (color1: string, color2: string): number => {
    const lum1 = colorContrast.getLuminance(color1);
    const lum2 = colorContrast.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = colorContrast.getRatio(foreground, background);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  },
};

// Screen reader announcements
export const announcements = {
  // Announce page navigation
  pageNavigation: (page: string) => {
    ariaHelpers.announce(`Navigated to ${page} page`);
  },

  // Announce form validation errors
  formErrors: (errors: string[]) => {
    const message = errors.length === 1 
      ? `Form error: ${errors[0]}`
      : `Form has ${errors.length} errors: ${errors.join(', ')}`;
    ariaHelpers.announce(message, 'assertive');
  },

  // Announce success messages
  success: (message: string) => {
    ariaHelpers.announce(`Success: ${message}`);
  },

  // Announce loading states
  loading: (message: string) => {
    ariaHelpers.announce(message);
  },
};

// Motion preferences
export const motionPreferences = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get appropriate animation duration
  getAnimationDuration: (defaultDuration: number): number => {
    return motionPreferences.prefersReducedMotion() ? 0 : defaultDuration;
  },

  // Apply motion preferences to an element
  applyToElement: (element: HTMLElement, animations: Record<string, string>) => {
    if (motionPreferences.prefersReducedMotion()) {
      Object.entries(animations).forEach(([property, value]) => {
        (element.style as any)[property] = 'none';
      });
    }
  },
};

// High contrast mode
export const highContrast = {
  // Check if user prefers high contrast
  prefersHighContrast: (): boolean => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  // Apply high contrast styles
  applyStyles: (element: HTMLElement) => {
    if (highContrast.prefersHighContrast()) {
      element.classList.add('high-contrast');
    }
  },
};

// Focus visible polyfill
export const focusVisible = {
  // Add focus-visible class to keyboard-focused elements
  init: () => {
    let hadKeyboardEvent = false;
    let hadFocusVisibleRecently = false;
    let hadFocusVisibleRecentlyTimeout: number;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      hadKeyboardEvent = true;
    };

    const onMouseDown = () => {
      hadKeyboardEvent = false;
    };

    const onFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      if (hadKeyboardEvent) {
        target.classList.add('focus-visible');
        hadFocusVisibleRecently = true;
        
        clearTimeout(hadFocusVisibleRecentlyTimeout);
        hadFocusVisibleRecentlyTimeout = window.setTimeout(() => {
          hadFocusVisibleRecently = false;
        }, 100);
      } else {
        target.classList.remove('focus-visible');
      }
    };

    const onBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      if (hadFocusVisibleRecently) {
        return;
      }
      
      target.classList.remove('focus-visible');
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);
  },
};

// Accessibility testing utilities
export const a11yTesting = {
  // Check if all images have alt text
  checkImageAltText: (): boolean => {
    const images = document.querySelectorAll('img');
    return Array.from(images).every(img => img.hasAttribute('alt'));
  },

  // Check if all form inputs have labels
  checkFormLabels: (): boolean => {
    const inputs = document.querySelectorAll('input, select, textarea');
    return Array.from(inputs).every(input => {
      const id = input.getAttribute('id');
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.hasAttribute('aria-label');
      const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
      return hasLabel || hasAriaLabel || hasAriaLabelledBy;
    });
  },

  // Check heading hierarchy
  checkHeadingHierarchy: (): boolean => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    return Array.from(headings).every(heading => {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      const isValid = currentLevel <= previousLevel + 1;
      previousLevel = currentLevel;
      return isValid;
    });
  },
};

// Initialize accessibility features
export const initAccessibility = () => {
  focusVisible.init();
  
  // Add CSS for focus-visible
  const style = document.createElement('style');
  style.textContent = `
    .js-focus-visible :focus:not(.focus-visible) {
      outline: none;
    }
    
    .focus-visible {
      outline: 2px solid hsl(var(--primary));
      outline-offset: 2px;
    }
    
    .high-contrast {
      filter: contrast(1.5);
    }
    
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
  document.head.appendChild(style);
};

export default {
  srOnly,
  focusManagement,
  ariaHelpers,
  keyboardNavigation,
  colorContrast,
  announcements,
  motionPreferences,
  highContrast,
  focusVisible,
  a11yTesting,
  initAccessibility,
};
