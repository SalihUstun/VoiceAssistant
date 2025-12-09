import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { authService } from './services/authService';


import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const userData = await authService.checkAuth();
        if (userData) {
          setInitialRoute({ name: 'Home', params: userData });
        } else {
          setInitialRoute({ name: 'Login', params: {} });
        }
      } catch (e) {
        setInitialRoute({ name: 'Login', params: {} });
      }
    };
    checkLogin();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00E0FF" />
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