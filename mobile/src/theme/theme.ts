export const theme = {
  colors: {
    background: '#121824',
    surfaceGlass: 'rgba(255, 255, 255, 0.08)',
    borderGlass: 'rgba(255, 255, 255, 0.15)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    primary: '#0D9488', // Vibrant Teal
    success: '#10B981', // Neon Green
    danger: '#F43F5E', // Rose/Coral
    error: '#F43F5E',
    white: '#FFFFFF',
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  shadows: {
    light: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  },
};

export type ThemeType = typeof theme;
