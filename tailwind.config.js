/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: 'var(--primary)',
                'primary-dark': 'var(--primary-dark)',
                secondary: 'var(--secondary)',
                accent: 'var(--accent)',
            },
            borderRadius: {
                std: 'var(--radius-std)',
                lg: 'var(--radius-lg)',
                pill: 'var(--radius-pill)',
            },
            fontSize: {
                // Échelle Outdoor & Mobile Haute Lisibilité (Zéro Hardcoding)
                // xs: 13px (au lieu de 12px) pour badges et métadonnées denses
                'xs': ['0.8125rem', { lineHeight: '1.2rem', letterSpacing: '0.01em' }],
                // sm: 15px (au lieu de 14px) pour dates, statuts et textes secondaires
                'sm': ['0.9375rem', { lineHeight: '1.4rem' }],
                // base: 16.5px (au lieu de 16px) pour corps de texte et inputs iOS
                'base': ['1.03125rem', { lineHeight: '1.55rem' }],
                // lg: 18.5px
                'lg': ['1.15625rem', { lineHeight: '1.7rem' }],
                // xl: 21px pour titres de section
                'xl': ['1.3125rem', { lineHeight: '1.8rem' }],
                // 2xl: 25px pour titres majeurs
                '2xl': ['1.5625rem', { lineHeight: '2.1rem' }],
                // 3xl: 30px
                '3xl': ['1.875rem', { lineHeight: '2.3rem' }],
                // 4xl: 38px pour KPI et compteurs financiers
                '4xl': ['2.375rem', { lineHeight: '2.6rem' }],
            }
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
    },
    plugins: [],
}
