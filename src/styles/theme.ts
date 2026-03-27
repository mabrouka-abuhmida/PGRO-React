/**
 * USW-inspired theme and design tokens
 * Based on spec.md section 2.1
 */

export const colours = {
  uswRed: '#BE1E2D', // Primary brand red (from hero panels)
  uswGreen: '#006B3F', // MSc AI hero green
  uswDark: '#111111', // Body text / headings
  uswOffWhite: '#F5F5F5', // Light background panels
  uswGrey: '#D9D9D9', // Borders, dividers
  accentAmber: '#FFB81C', // Optional attention accent
  white: '#FFFFFF',
};

export const typography = {
  fontFamily: 'system-ui, -apple-system, "Inter", "Montserrat", sans-serif',
  hHero: {
    fontSize: '2.5rem',
    fontWeight: 800,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    lineHeight: 1.2,
  },
  hSection: {
    fontSize: '1.4rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    lineHeight: 1.3,
  },
  body: {
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  bodyLarge: {
    fontSize: '1.125rem', // 18px
    lineHeight: 1.5,
  },
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

export const theme = {
  colours,
  typography,
  spacing,
  breakpoints,
};

export default theme;

