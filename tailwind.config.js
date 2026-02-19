/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
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
            }
        },
    },
    plugins: [],
}
