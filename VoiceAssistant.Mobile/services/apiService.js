import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// API Adresini buraya yaz
const API_URL = "http://192.168.43.22:5242/api";

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