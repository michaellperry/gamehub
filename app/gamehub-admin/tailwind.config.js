/** @type {import('tailwindcss').Config} */
import { colors, typography, spacing, borderRadius, shadows, breakpoints } from './src/theme/tokens.js';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: breakpoints,
    extend: {
      colors,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
      letterSpacing: typography.letterSpacing,
      spacing,
      borderRadius,
      boxShadow: shadows,
    },
  },
  plugins: [
    // Add plugins if needed
  ],
}
