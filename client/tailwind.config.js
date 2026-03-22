/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // DESIGN.md surface hierarchy
        surface:                  '#0b1326',
        surface_container_low:    '#131b2e',
        surface_container:        '#171f33',
        surface_container_high:   '#222a3d',
        surface_container_highest:'#2c3448',
        surface_bright:           '#31394d',
        surface_variant:          '#3a4258',
        // Text
        on_surface:               '#dae2fd',
        on_surface_variant:       '#9aa3b8',
        on_tertiary_container:    '#a8b0c8',
        // Accent
        primary:                  '#bcc7de',
        primary_container:        '#0c1829',
        on_primary:               '#0c1829',
        // Sentiment
        secondary:                '#4edea3',   // positive — emerald
        tertiary:                 '#ffb95f',   // neutral  — amber
        error:                    '#ffb4ab',   // negative — crimson
        // Borders
        outline_variant:          '#45464d',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'headline-lg': ['2rem',    { lineHeight: '2.4rem',  fontWeight: '700' }],
        'headline-md': ['1.5rem',  { lineHeight: '1.9rem',  fontWeight: '700' }],
        'headline-sm': ['1.25rem', { lineHeight: '1.6rem',  fontWeight: '600' }],
        'body-md':     ['0.875rem',{ lineHeight: '1.4rem',  fontWeight: '400' }],
        'body-sm':     ['0.8125rem',{ lineHeight: '1.3rem', fontWeight: '400' }],
        'label-md':    ['0.75rem', { lineHeight: '1.1rem',  fontWeight: '500', letterSpacing: '0.05em' }],
        'label-sm':    ['0.6875rem',{ lineHeight: '1rem',   fontWeight: '500', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.75rem',
      },
      boxShadow: {
        ambient: '0 8px 48px 0 rgba(218,226,253,0.05)',
        float:   '0 8px 64px 0 rgba(218,226,253,0.06)',
      },
      spacing: {
        // DESIGN.md spacing scale
        '8':  '1.75rem',
        '10': '2.25rem',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #bcc7de 0%, #0c1829 100%)',
      },
    },
  },
  plugins: [],
};
