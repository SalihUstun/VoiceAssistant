import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../services/authService';

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if(!username || !password || !firstName) {
        Alert.alert("Eksik Bilgi", "Lütfen zorunlu alanları doldurun.");
        return;
    }

    setLoading(true);
    try {
      await authService.register(firstName, lastName, username, email, password);
      
      Alert.alert('Başarılı', 'Hesabınız oluşturuldu! Şimdi giriş yapabilirsiniz.', [
        { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Kayıt olunamadı. Kullanıcı adı alınmış olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
      </TouchableOpacity>

      <Text style={styles.title}>Yeni Hesap</Text>
      <Text style={styles.subtitle}>Asistan dünyasına katılın</Text>

      <View style={styles.row}>
        <TextInput placeholder="Ad" placeholderTextColor="#666" style={[styles.input, {flex:1, marginRight:10}]} onChangeText={setFirstName} />
        <TextInput placeholder="Soyad" placeholderTextColor="#666" style={[styles.input, {flex:1}]} onChangeText={setLastName} />
      </View>
      
      <TextInput placeholder="Kullanıcı Adı" placeholderTextColor="#666" style={styles.input} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput placeholder="E-posta" placeholderTextColor="#666" style={styles.input} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Şifre" placeholderTextColor="#666" style={styles.input} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>KAYIT OL</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 20 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  row: { flexDirection: 'row', marginBottom: 15 },
  input: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, color: '#FFF', fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#32D74B', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});