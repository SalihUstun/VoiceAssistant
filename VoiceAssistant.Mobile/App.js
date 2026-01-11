import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { authService } from './services/authService';


import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        console.log('   Checking authentication...');
        const userData = await authService.checkAuth();
        if (userData) {
          console.log('   User authenticated:', userData.username);
          setInitialRoute({ name: 'Home', params: userData });
        } else {
          console.log('   No authentication found');
          setInitialRoute({ name: 'Login', params: {} });
        }
      } catch (e) {
        console.error('🚨 Auth check error:', e);
        setError(e.message);
        setInitialRoute({ name: 'Login', params: {} });
      }
    };
    checkLogin();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#FF3B30', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          Hata: {error}
        </Text>
        <TouchableOpacity 
          onPress={() => {
            setError(null);
            setInitialRoute({ name: 'Login', params: {} });
          }}
          style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 10 }}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00E0FF" />
        <Text style={{ color: '#AAA', marginTop: 20, fontSize: 16 }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>

      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <Stack.Navigator 
        initialRouteName={initialRoute.name}
        screenOptions={{ 
          headerShown: false, 
          contentStyle: { backgroundColor: '#121212' }, 
          animation: 'slide_from_right' 
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} initialParams={initialRoute.params} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}