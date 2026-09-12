import axios from 'axios';
import * as SecureStore from 'expo-secure-store';


// Bilgisayarınızın yerel ağ IP'si + .NET API portu.
// .env dosyasında EXPO_PUBLIC_API_URL tanımlayarak kodu değiştirmeden ayarlayabilirsiniz.
// iOS simülatöründe "http://localhost:5242/api" da çalışır; gerçek cihazda LAN IP gerekir.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.177.35:5243/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, 
});


api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;