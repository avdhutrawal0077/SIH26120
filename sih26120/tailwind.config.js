/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#001f12',
        secondary: '#ffffe4',
        navy: {
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      spacing: {
        'space-xs': '4px',
        'space-sm': '8px',
        'space-md': '12px',
        'space-lg': '16px',
        'space-xl': '24px',
      },
      fontSize: {
        'metric-display': ['2.25rem', { lineHeight: '1', fontWeight: '700' }],
        'metric-value': ['0.875rem', { lineHeight: '1.25', fontWeight: '600' }],
        'headline-lg': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'headline-md': ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label-caps': ['0.625rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '0.05em' }],
        'telemetry-data': ['0.8125rem', { lineHeight: '1.3', fontWeight: '500' }],
        'telemetry-dense': ['0.6875rem', { lineHeight: '1.3', fontWeight: '400' }],
      },
      fontFamily: {
        'metric-display': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        'metric-value': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        'headline-lg': ['"Inter"', 'system-ui', 'sans-serif'],
        'headline-md': ['"Inter"', 'system-ui', 'sans-serif'],
        'body-md': ['"Inter"', 'system-ui', 'sans-serif'],
        'label-caps': ['"Inter"', 'system-ui', 'sans-serif'],
        'telemetry-data': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        'telemetry-dense': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
      },
    },
  },
  plugins: [],
}
