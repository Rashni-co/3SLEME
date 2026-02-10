/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                army: {
                    50: '#f4f6f2',
                    100: '#e3e9de',
                    200: '#c5d3bd',
                    300: '#9eb594',
                    400: '#7a966e',
                    500: '#5e7b52',
                    600: '#48613e',
                    700: '#3a4d33',
                    800: '#303e2b',
                    900: '#283425',
                }
            }
        },
    },
    plugins: [],
}
