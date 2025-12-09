import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Eksik Bilgi', 'Lütfen kullanıcı adı ve şifrenizi girin.');
      return;
    }

    setLoading(true);
    try {
      const userData = await authService.login(username, password);
      
      if (userData) {
        navigation.replace('Home', userData);
      } else {
        Alert.alert('Hata', 'Giriş yapılamadı.');
      }
    } catch (error) {
      Alert.alert('Giriş Başarısız', 'Kullanıcı adı veya şifre hatalı olabilir.\nLütfen sunucunun açık olduğundan emin olun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="robot-outline" size={60} color="#00E0FF" />
        </View>
        <Text style={styles.title}>JARVIS AI</Text>
        <Text style={styles.subtitle}>Sesli Asistanın Seni Bekliyor</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="account" size={20} color="#666" style={styles.icon} />
            <TextInput 
                placeholder="Kullanıcı Adı" 
                placeholderTextColor="#666"
                style={styles.input} 
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
        </View>

        <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock" size={20} color="#666" style={styles.icon} />
            <TextInput 
                placeholder="Şifre" 
                placeholderTextColor="#666"
                style={styles.input} 
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <Text style={styles.buttonText}>GİRİŞ YAP</Text>
            )}
        </TouchableOpacity>

        <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabın yok mu?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Kayıt Ol</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#00E0FF', marginBottom: 15, shadowColor: "#00E0FF", shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', letterSpacing: 2 },
  subtitle: { color: '#888', marginTop: 5, fontSize: 14 },
  formContainer: { width: '100%' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#333' },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', fontSize: 16 },
  button: { backgroundColor: '#007AFF', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#007AFF', shadowOpacity: 0.4, shadowRadius: 5, elevation: 5 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#888', marginRight: 5 },
  linkText: { color: '#00E0FF', fontWeight: 'bold' }
});