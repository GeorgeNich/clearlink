/** Tailwind theme. Values point at the CSS variables in src/styles, so these utilities stay in sync with them.
 *  e.g. bg-panel text-fg rounded-md shadow-bevel min-h-target font-display */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: 'var(--cl-bg)',
        deep: 'var(--cl-sunken)',
        panel: 'var(--cl-surface)',
        raised: 'var(--cl-raised)',
        sunken: 'var(--cl-sunken)',
        tile: 'var(--cl-tile)',
        fg: { DEFAULT: 'var(--cl-text)', 2: 'var(--cl-text-2)', 3: 'var(--cl-text-3)', disabled: 'var(--cl-text-3)' },
        ink: 'var(--cl-accent-ink)',
        accent: { DEFAULT: 'var(--cl-accent)', hover: 'var(--cl-accent-hover)', pressed: 'var(--cl-accent-hover)', subtle: 'var(--cl-accent-soft)', strong: 'var(--cl-accent-soft)' },
        danger: { DEFAULT: 'var(--cl-danger)', hover: 'var(--cl-danger-hover)', pressed: 'var(--cl-danger-hover)', text: 'var(--cl-danger-text)', subtle: 'var(--cl-danger-soft)' },
        success: { DEFAULT: 'var(--cl-ok-text)', subtle: 'var(--cl-ok-soft)' },
        secondary: { DEFAULT: 'var(--cl-raised)', hover: 'var(--cl-hover)', pressed: 'var(--cl-hover)' },
        disabled: { fill: 'var(--cl-raised)', text: 'var(--cl-text-3)' },
        person: { amber: 'var(--cl-person-amber)', rose: 'var(--cl-person-rose)', sage: 'var(--cl-person-sage)', dusk: 'var(--cl-person-dusk)', plum: 'var(--cl-person-plum)' },
        line: { subtle: 'var(--cl-line)', DEFAULT: 'var(--cl-line)', strong: 'var(--cl-line-strong)', accent: 'var(--cl-line)' },
      },
      fontFamily: {
        display: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        ui: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['14px', '20px'], sm: ['15px', '22px'], base: ['16px', '24px'], lg: ['18px', '26px'],
        xl: ['22px', '28px'], '2xl': ['28px', '34px'], '3xl': ['36px', '42px'], '4xl': ['48px', '52px'], '5xl': ['64px', '66px'],
        chat: ['16px', '24px'], 'code-phone': ['32px', '1'], 'code-laptop': ['40px', '1'],
      },
      spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px', target: '48px', 'target-phone': '52px', panel: '360px' },
      minHeight: { target: '48px', 'target-phone': '52px' },
      minWidth: { target: '48px' },
      borderRadius: { sm: '6px', md: '10px', lg: '14px', xl: '20px', '2xl': '28px' },
      boxShadow: {
        sm: 'var(--cl-shadow-sm)', md: 'var(--cl-shadow)', lg: 'var(--cl-shadow)', sheet: 'var(--cl-shadow)',
        bevel: 'var(--cl-bevel)', 'bevel-sunken': 'var(--cl-bevel-sunken)',
        glow: 'var(--cl-glow-accent)', 'glow-soft': 'var(--cl-glow-accent-soft)', focus: 'var(--cl-glow-focus)',
      },
      transitionTimingFunction: { gentle: 'cubic-bezier(0.25,0.1,0.25,1)', out: 'cubic-bezier(0.22,0.61,0.36,1)' },
      transitionDuration: { fast: '160ms', base: '240ms', slow: '400ms', glow: '600ms' },
      letterSpacing: { code: '0.08em', display: '-0.01em', caps: '0.06em' },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'rise-in': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-in': 'fade-in 240ms cubic-bezier(0.22,0.61,0.36,1) both', 'rise-in': 'rise-in 240ms cubic-bezier(0.22,0.61,0.36,1) both' },
    },
  },
};
