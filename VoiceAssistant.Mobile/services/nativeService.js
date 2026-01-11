import { Linking, Alert, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { contactsService } from './contactsService';

class NativeService {
  
  // Alarm oluşturma
  async createAlarm(time, label) {
    try {
      console.log(`⏰ Native alarm oluşturuluyor: ${time} - ${label}`);
      
      if (Platform.OS === 'android') {
        // Saati parse et
        const [hours, minutes] = time.split(':').map(num => parseInt(num));
        console.log(`⏰ Parsed time: ${hours}:${minutes}`);
        
        // Birden fazla yöntem dene
        const methods = [
          () => this.createAlarmWithIntent(hours, minutes, label),
          () => this.createAlarmWithProvider(hours, minutes, label),
          () => this.openClockAppWithTime(hours, minutes, label)
        ];
        
        for (let i = 0; i < methods.length; i++) {
          try {
            console.log(`⏰ Yöntem ${i + 1} deneniyor...`);
            await methods[i]();
            console.log(`✅ Yöntem ${i + 1} başarılı!`);
            return;
          } catch (error) {
            console.log(`❌ Yöntem ${i + 1} başarısız:`, error.message);
            if (i === methods.length - 1) {
              throw error;
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Tüm alarm yöntemleri başarısız:', error);
      Alert.alert('Hata', `Alarm oluşturulamadı. Lütfen manuel olarak saat uygulamasından ${time} için alarm kurun.`);
    }
  }
  
  // Intent ile alarm oluştur
  async createAlarmWithIntent(hours, minutes, label) {
    const alarmIntent = {
      action: 'android.intent.action.SET_ALARM',
      extra: {
        'android.intent.extra.alarm.HOUR': hours,
        'android.intent.extra.alarm.MINUTES': minutes,
        'android.intent.extra.alarm.MESSAGE': label,
        'android.intent.extra.alarm.SKIP_UI': false
      }
    };
    
    await IntentLauncher.startActivityAsync('android.intent.action.SET_ALARM', alarmIntent);
  }
  
  // AlarmClock provider ile alarm oluştur
  async createAlarmWithProvider(hours, minutes, label) {
    const alarmUri = `content://com.android.calendar/time/${Date.now()}`;
    const alarmUrl = `alarmclock://set?hour=${hours}&minute=${minutes}&message=${encodeURIComponent(label)}`;
    
    const supported = await Linking.canOpenURL(alarmUrl);
    if (supported) {
      await Linking.openURL(alarmUrl);
    } else {
      throw new Error('AlarmClock provider desteklenmiyor');
    }
  }
  
  // Clock uygulamasını belirli saatle aç
  async openClockAppWithTime(hours, minutes, label) {
    try {
      console.log(`⏰ Clock app açılıyor: ${hours}:${minutes} - ${label}`);
      
      // Farklı clock app URL'leri dene
      const clockUrls = [
        `android-app://com.google.android.deskclock/timer?hour=${hours}&minute=${minutes}`,
        `android-app://com.google.android.deskclock`,
        `android-app://com.android.deskclock`,
        `android-app://com.samsung.android.app.clockpackage`,
        `android-app://com.sec.android.app.clockpackage`,
        `android-app://com.htc.android.worldclock`
      ];
      
      for (const url of clockUrls) {
        try {
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            console.log(`✅ Clock app açılıyor: ${url}`);
            await Linking.openURL(url);
            
            // Kullanıcıya bilgi ver
            setTimeout(() => {
              Alert.alert(
                "Saat Uygulaması Açıldı", 
                `Saat uygulaması açıldı. Lütfen ${hours}:${minutes.toString().padStart(2, '0')} için "${label}" alarmını kurun.`,
                [{ text: "Tamam" }]
              );
            }, 1500);
            
            return;
          }
        } catch (error) {
          console.log(`❌ URL başarısız: ${url}`);
          continue;
        }
      }
      
      throw new Error('Hiçbir saat uygulaması bulunamadı');
      
    } catch (error) {
      console.error('Clock app açma hatası:', error);
      Alert.alert(
        'Saat Uygulaması Bulunamadı', 
        `Lütfen telefonunuzun saat uygulamasından ${hours}:${minutes.toString().padStart(2, '0')} için "${label}" alarmını manuel olarak kurun.`
      );
    }
  }
  
  // Clock uygulamasını aç
  async openClockApp() {
    const clockUrls = [
      'android-app://com.google.android.deskclock',
      'android-app://com.android.deskclock',
      'android-app://com.samsung.android.app.clockpackage'
    ];
    
    for (const url of clockUrls) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    Alert.alert('Bilgi', 'Saat uygulaması bulunamadı');
  }
  
  // Telefon araması
  async makeCall(phoneNumber) {
    try {
      console.log(`📞 Native arama başlatılıyor: ${phoneNumber}`);
      
      const url = `tel:${phoneNumber}`;
      console.log(`📞 Arama URL'si: ${url}`);
      
      const supported = await Linking.canOpenURL(url);
      console.log(`📞 URL destekleniyor mu: ${supported}`);
      
      if (supported) {
        console.log('📞 Linking.openURL çağrılıyor...');
        await Linking.openURL(url);
        console.log('✅ Arama başlatıldı');
      } else {
        console.log('❌ Tel URL desteklenmiyor');
        Alert.alert('Hata', 'Arama özelliği desteklenmiyor');
      }
    } catch (error) {
      console.error('❌ Arama hatası:', error);
      Alert.alert('Hata', `Arama başlatılamadı: ${error.message}`);
    }
  }
  
  // Uygulama başlatma
  async launchApp(packageName, appName) {
    try {
      console.log(`🚀 Uygulama başlatılıyor: ${appName} (${packageName})`);
      
      if (Platform.OS === 'android') {
        const appUrl = `android-app://${packageName}`;
        const supported = await Linking.canOpenURL(appUrl);
        
        if (supported) {
          await Linking.openURL(appUrl);
          console.log('✅ Uygulama başlatıldı');
        } else {
          // Play Store'da aç
          const playStoreUrl = `market://details?id=${packageName}`;
          const playStoreSupported = await Linking.canOpenURL(playStoreUrl);
          
          if (playStoreSupported) {
            Alert.alert(
              'Uygulama Bulunamadı',
              `${appName} yüklü değil. Play Store'da açılsın mı?`,
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Aç', onPress: () => Linking.openURL(playStoreUrl) }
              ]
            );
          } else {
            Alert.alert('Hata', `${appName} bulunamadı`);
          }
        }
      }
    } catch (error) {
      console.error('Uygulama başlatma hatası:', error);
      Alert.alert('Hata', 'Uygulama başlatılamadı');
    }
  }
  
  // Popüler uygulamaların package name'lerini al
  getAppPackageName(appName) {
    const packages = {
      'whatsapp': 'com.whatsapp',
      'instagram': 'com.instagram.android',
      'facebook': 'com.facebook.katana',
      'twitter': 'com.twitter.android',
      'spotify': 'com.spotify.music',
      'youtube': 'com.google.android.youtube',
      'gmail': 'com.google.android.gm',
      'chrome': 'com.android.chrome',
      'maps': 'com.google.android.apps.maps',
      'telegram': 'org.telegram.messenger',
      'tiktok': 'com.zhiliaoapp.musically',
      'netflix': 'com.netflix.mediaclient',
      'amazon': 'com.amazon.mShop.android.shopping'
    };
    
    return packages[appName.toLowerCase()];
  }
  
  // Demo kişiler (fallback)
  getContactPhone(contactName) {
    const contacts = {
      'babam': '+905551234567',
      'annem': '+905551234568',
      'kardeşim': '+905551234569',
      'eşim': '+905551234570',
      'ablam': '+905551234571',
      'abim': '+905551234572'
    };
    
    return contacts[contactName.toLowerCase()];
  }
  
  // Gerçek kişilerden telefon numarası bul
  async findRealContactPhone(contactName) {
    try {
      console.log(`🔍 Gerçek kişilerde aranıyor: ${contactName}`);
      
      // Gerçek kişilerden ara
      const realPhone = await contactsService.findPhoneByName(contactName);
      
      if (realPhone) {
        console.log(`✅ Gerçek kişide bulundu: ${realPhone}`);
        return realPhone;
      }
      
      // Bulunamazsa demo kişilerden ara
      console.log(`🔄 Demo kişilerde aranıyor: ${contactName}`);
      const demoPhone = this.getContactPhone(contactName);
      
      if (demoPhone) {
        console.log(`✅ Demo kişide bulundu: ${demoPhone}`);
        return demoPhone;
      }
      
      console.log(`❌ Hiçbir yerde bulunamadı: ${contactName}`);
      return null;
      
    } catch (error) {
      console.error('Kişi arama hatası:', error);
      return this.getContactPhone(contactName); // Fallback
    }
  }
}

export const nativeService = new NativeService();