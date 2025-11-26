/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                postech: {
                    50: '#fdf2f6',
                    100: '#fbe6ed',
                    200: '#f6c0d3',
                    300: '#f09ab9',
                    400: '#e64d85',
                    500: '#c92468',
                    600: '#a61955', // POSTECH Red
                    700: '#851444',
                    800: '#630f33',
                    900: '#420a22',
                    950: '#260411',
                },
                'postech-orange': '#F6A700',
                'postech-silver': '#C5C6CA',
                'postech-gray': '#7A7772',
                'postech-gold': '#DABA65',
            }
        },
    },
    plugins: [],
}
