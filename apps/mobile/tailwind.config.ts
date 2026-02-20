import type { Config } from 'tailwindcss'

export default {
  content: [
    './App.tsx',
    './screens/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './navigation/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',
        danger: '#FF3B30',
        muted: '#666666',
      },
    },
  },
  plugins: [],
} satisfies Config
