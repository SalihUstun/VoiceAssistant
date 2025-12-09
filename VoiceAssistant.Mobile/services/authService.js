import api from './apiService';
import * as SecureStore from 'expo-secure-store';

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/Auth/login', { username, password });
      
      const { token, userId, username: userDisplay } = response.data;
      
      if (token) {
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userId', userId.toString());
        await SecureStore.setItemAsync('username', userDisplay);
        return response.data;
      }
      return null;
    } catch (error) {
      throw error; 
    }
  },


  register: async (firstName, lastName, username, email, password) => {
    try {
      const response = await api.post('/Auth/register', {
        firstName, lastName, username, email, password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },


  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('username');
  },


  checkAuth: async () => {
    const token = await SecureStore.getItemAsync('userToken');
    const userId = await SecureStore.getItemAsync('userId');
    const username = await SecureStore.getItemAsync('username');
    
    if (token && userId) {
      return { token, userId, username };
    }
    return null;
  }
};