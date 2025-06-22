module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#87CEEB', // Sky Blue (biru muda)
        secondary: '#E0F6FF', // Light Blue (biru sangat muda)
        accent: '#4FC3F7', // Medium Blue
        'light-blue': '#B3E5FC',
        'sky-blue': '#87CEEB',
        'powder-blue': '#B0E0E6',
        'alice-blue': '#F0F8FF',
        'ghost-white': '#F8F8FF'
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif']
      },
      backgroundImage: {
        'blue-gradient': 'linear-gradient(135deg, #87CEEB 0%, #E0F6FF 100%)',
        'blue-white-gradient': 'linear-gradient(to right, #87CEEB, #ffffff)',
        'soft-blue': 'linear-gradient(135deg, #B3E5FC 0%, #ffffff 100%)'
      }
    },
  },
  plugins: [],
}