// Konfigurasi API untuk environment yang berbeda
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://4171-103-84-209-89.ngrok-free.app'
  : 'https://4171-103-84-209-89.ngrok-free.app'; // Gunakan URL ngrok untuk dev dan prod

export default API_BASE_URL;