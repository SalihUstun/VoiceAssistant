import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, FlatList, SafeAreaView, Animated, Switch } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy'; 
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/apiService'; 
import { authService } from '../services/authService'; 
import { commandService } from '../services/commandService'; 
import { permissionService } from '../services/permissionService';
import { contactsService } from '../services/contactsService'; 


const WAKE_WORDS = ["jarvis", "knk", "kanka", "hey"]; 

export default function HomeScreen({ route, navigation }) {
  const { userId, username } = route.params; 

  const [recording, setRecording] = useState();
  const [messages, setMessages] = useState([
    { id: '1', text: `Merhaba ${username}! Ben Jarvis. Nasıl yardımcı olabilirim?`, sender: 'ai' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoMode, setAutoMode] = useState(false); 
  const [isAwake, setIsAwake] = useState(false);
  const [sound, setSound] = useState(); 
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef();


  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


  useEffect(() => {
    (async () => {
      console.log('🚀 HomeScreen başlatılıyor...');
      
      // Ses izinlerini kontrol et
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Hata', 'Mikrofon izni gerekli.');
        return;
      }

      // Ses ayarlarını yapılandır
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true, 
        staysActiveInBackground: true, 
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });
      
      // Diğer izinleri kontrol et ve kişileri yükle
      setTimeout(async () => {
        await permissionService.checkAllPermissions();
        
        // Kişileri yükle
        console.log('📋 Kişiler yükleniyor...');
        const contactsLoaded = await contactsService.loadContacts();
        
        if (contactsLoaded) {
          console.log('✅ Kişiler başarıyla yüklendi');
          // İlk 5 kişiyi listele (debug amaçlı)
          contactsService.listAllContacts();
        } else {
          console.log('❌ Kişiler yüklenemedi');
        }
      }, 2000); // 2 saniye sonra diğer izinleri kontrol et
    })();
  }, []);


  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);


  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Çıkış yapmak istiyor musunuz?", [
        { text: "İptal", style: "cancel" },
        { text: "Çıkış", style: "destructive", onPress: async () => {
            setAutoMode(false);
            if(recording) await stopRecording(recording);
            await authService.logout();
            navigation.replace('Login');
        }}
    ]);
  };

  const clearChat = () => {
    setMessages([{ id: generateId(), text: 'Hafızam temizlendi.', sender: 'ai' }]);
    setIsAwake(false);
  };


  async function playResponseAudio(base64String) {
    try {
      console.log('🔊 Ses çalma başlıyor...');
      
      if (!base64String) {
        console.log('❌ Base64 string boş');
        return;
      }
      
      const uri = FileSystem.cacheDirectory + 'response.mp3';
      
      // Legacy API kullanarak
      await FileSystem.writeAsStringAsync(uri, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('📁 Ses dosyası yazıldı:', uri);
      
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          console.log('✅ Ses çalma tamamlandı');
          await newSound.unloadAsync();
          if (autoMode) {
             setTimeout(() => startRecording(), 500);
          }
        }
      });

      console.log('▶️ Ses çalmaya başlıyor...');
      await newSound.playAsync();
    } catch (error) {
      console.log('❌ Ses çalma hatası:', error);
      if (autoMode) setTimeout(() => startRecording(), 500);
    }
  }

  useEffect(() => {
    let timeoutId;
    if (autoMode && !recording && !isProcessing && !sound?._loaded) {
      timeoutId = setTimeout(() => startRecording(), 500);
    }
    return () => clearTimeout(timeoutId);
  }, [autoMode, isProcessing, recording]); 

  const startPulse = () => {
    Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  };
  const stopPulse = () => { pulseAnim.setValue(1); pulseAnim.stopAnimation(); };

  async function startRecording() {
    try {
      if (isProcessing || recording) return;
      
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording);
      startPulse();

      if (autoMode) {
        setTimeout(() => stopRecording(newRecording), 4000); 
      }
    } catch (err) { console.error('Kayıt hatası:', err); setRecording(undefined); }
  }

  async function stopRecording(activeRecording = recording) {
    if (!activeRecording) return;
    
    stopPulse();
    setRecording(undefined); 
    
    try {
        await activeRecording.stopAndUnloadAsync();
        const uri = activeRecording.getURI(); 
        if (uri) uploadAudio(uri);
    } catch (error) { console.log("Durdurma hatası:", error); }
  }

  const handleMicPress = () => recording ? stopRecording(recording) : startRecording();

  async function uploadAudio(uri) {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('UserId', userId); 
    formData.append('AudioFile', { uri: uri, type: 'audio/m4a', name: 'voice.m4a' });

    try {
      console.log('📤 Ses dosyası gönderiliyor...');
      const response = await api.post('/Assistant/send-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('📥 API yanıtı alındı:', response.status);
      const { recognizedText, aiResponse, audioBase64, intent, action, commandResult } = response.data;
      
      console.log('🎯 Tanınan metin:', recognizedText);
      console.log('💬 AI yanıtı:', aiResponse);
      console.log('🔊 Audio Base64 var mı:', audioBase64 ? 'Evet' : 'Hayır');
      console.log('🎯 Intent:', intent, 'Action:', action);
      
      // Komut işleme sonucunu handle et
      if (commandResult) {
        console.log('🎯 CommandResult bulundu, handle ediliyor...');
        // Action bilgisini commandResult'a ekle
        commandResult.action = action;
        commandService.handleCommandResult(commandResult);
      } else {
        console.log('❌ CommandResult bulunamadı');
      }
      
      if (recognizedText && recognizedText !== "Ses anlaşılamadı") {
          const lowerText = recognizedText.toLowerCase();
          const wakeWordDetected = WAKE_WORDS.some(word => lowerText.includes(word));

          if (!autoMode || isAwake || wakeWordDetected) {
              
              if (wakeWordDetected) {
                  setIsAwake(true);
                  setTimeout(() => setIsAwake(false), 20000); 
              }
              
              addMessage(recognizedText, 'user');
              
              // Intent ve action bilgisini göster (debug amaçlı)
              if (intent && action) {
                console.log(`🎯 Intent: ${intent}, Action: ${action}`);
              }
              
              if (aiResponse) addMessage(aiResponse, 'ai');
              if (audioBase64) {
                  console.log('🔊 Sesli yanıt çalmaya başlıyor...');
                  await playResponseAudio(audioBase64);
                  return; 
              } else {
                  console.log('❌ Audio Base64 bulunamadı');
              }
          }
      } else {
          console.log('❌ Tanınan metin yok veya anlaşılamadı');
      }
    } catch (error) {
      console.log("❌ Upload hatası:", error);
      if(error.response?.status === 401) {
          Alert.alert("Oturum Doldu", "Lütfen tekrar giriş yapın.", [{text:"OK", onPress: () => navigation.replace('Login')}]);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: generateId(), text, sender }]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.iconButton}><MaterialCommunityIcons name="logout" size={26} color="#FF3B30" /></TouchableOpacity>
        <Text style={styles.headerTitle}>JARVIS</Text>
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <TouchableOpacity onPress={clearChat} style={[styles.iconButton, {marginRight:10}]}><MaterialCommunityIcons name="delete-sweep" size={26} color="#888" /></TouchableOpacity>
            <Switch value={autoMode} onValueChange={setAutoMode} trackColor={{ false: "#333", true: "#00E0FF" }} thumbColor={autoMode ? "#FFF" : "#f4f3f4"}/>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={item.sender === 'user' ? styles.userText : styles.aiText}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.orbContainer}>
            <Animated.View style={[styles.glow, { transform: [{ scale: pulseAnim }], opacity: isProcessing ? 0.5 : 1 }]} />
            {!autoMode ? (
                <TouchableOpacity onPress={handleMicPress} disabled={isProcessing} activeOpacity={0.8} style={[styles.manualButton, recording && styles.recordingButton]}>
                    <Ionicons name={isProcessing ? "hourglass" : recording ? "stop" : "mic"} size={32} color="#FFF" />
                </TouchableOpacity>
            ) : (
                <View style={[styles.orb, isProcessing ? styles.orbProcessing : styles.orbListening]}>
                     <MaterialCommunityIcons name={isProcessing ? "thought-bubble" : "access-point"} size={40} color="#FFF" />
                </View>
            )}
        </View>
        <Text style={styles.statusText}>{isProcessing ? "Düşünüyorum..." : autoMode ? (isAwake ? "Dinliyorum..." : 'Uyuyor...') : recording ? "Dinliyorum..." : "Konuşmak için dokun"}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' }, 
  header: { padding: 15, paddingTop: 50, backgroundColor: '#1E1E1E', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333', elevation: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', letterSpacing: 1 },
  iconButton: { padding: 5 },
  chatContainer: { padding: 15, paddingBottom: 170 },
  bubble: { maxWidth: '85%', padding: 14, borderRadius: 20, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#252525', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#333' },
  userText: { color: '#FFF', fontSize: 16 },
  aiText: { color: '#E0E0E0', fontSize: 16, lineHeight: 22 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30, 30, 30, 0.95)', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderTopWidth: 1, borderTopColor: '#333' },
  orbContainer: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  glow: { position: 'absolute', width: '100%', height: '100%', borderRadius: 50, backgroundColor: 'rgba(0, 224, 255, 0.2)' },
  manualButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', zIndex: 2, elevation: 10 },
  recordingButton: { backgroundColor: '#FF3B30' },
  orb: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', zIndex: 2, borderWidth: 2, borderColor: '#333' },
  orbListening: { backgroundColor: '#32D74B' },
  orbProcessing: { backgroundColor: '#00E0FF' },
  statusText: { color: '#AAA', fontSize: 14, fontWeight: '500', marginTop: 5 }
});